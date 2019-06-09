'use strict';

var FALSE = 0;
var TRUE = -1;

function Forth(next) {
  // Core structures
  var context = {
    stack: Stack('Evaluation Stack'),
    returnStack: Stack('Return Stack'),
    dictionary: Dictionary(),
    memory: Memory(),
    // This is set when the interpreter is waiting for a key to be pressed or sleeping
    pause: false,
    // This is set within readLine as a callback to continue processing tokens
    // once a key has been pressed or sleep has finished
    onContinue: null
  };

  // This variable is shared across multiple calls to readLine,
  // as definitions can span multiple lines
  var currentDefinition = null;

  function MissingWordError(word) {
    this.message = word + " ? ";
  }

  /// Neo syscall function
  function MissingSyscallError(word) {
    this.message = word + " ? (unknown Neo blockchain syscall) ";
  }

  function namedFunction(name, func) {
    func._name = name;
    return func;
  }

  // Convert token into an action that executes that token's behavior
  function tokenToAction(token) {
    var word = token.value;
    var definition = context.dictionary.lookup(word);

    if (token.isStringLiteral) {
      return namedFunction("String: " + word, function (context) {
        return word;
      });
    }
    // TODO: contributed part on StringPushLiteral s" (TODO make PR)
    else if (token.isStringPushLiteral) {
      return namedFunction("PushString: " + word, function (context) {
        context.stack.push(word);
      });
    }
    // TODO: contributed part on NeoSyscallLiteral syscall" (TODO: do not make PR, think on something better...)
    else if (token.isNeoSyscallLiteral) {
      return namedFunction("NeoSyscallString: " + word, function (context) {
        //context.stack.push(word);
        invokeNeoSyscall(word);
        // TODO: Neo Syscall!!

      });
    } 
    else if (definition !== null) {
      return definition;
    } else if (isFinite(word)) {
      return namedFunction("Number: " + word, function (context) {
        context.stack.push(+word);
      });
    } else {
      throw new MissingWordError(word);
    }

    return function () {
      return "";
    };
  }

  function addToDictionary(name, definition) {
    context.dictionary.add(name, namedFunction(name, definition));
  }

  // compile actions into definition and add definition to dictionary
  function compileAndAddToDictionary(name, actions) {
    var definition = compile(context.dictionary, actions);
    addToDictionary(name, definition);
  }

  function createVariable(name) {
    var pointer = context.memory.addVariable(name);
    addToDictionary(name, function (context) {
      context.stack.push(pointer);
    });
  }

  // Neo blockchain only. TODO: do not need to contribute this part (not FORTH related)
  function invokeNeoSyscall(name) {
    if(name == "Neo.Learn.Notify")
    {
      var str = context.stack.pop();
      alert(str);
    }
    else if(name == "Neo.Learn.Log")
    {
      var str = context.stack.pop();
      console.log(str);
    } 
    else if(name == "Neo.Learn.Sleep")
    {
      var timeout = context.stack.pop();
      context.pause = true;
  
      setTimeout(function () {
        context.pause = false;
        context.onContinue();
      }, timeout);
    } 
    else if(name == "Neo.Learn.Random")
    {
      var range = context.stack.pop();
      context.stack.push(Math.floor(Math.random() * range));
    }
    else
      throw new MissingSyscallError(name);
  }

  function createConstant(name, value) {
    addToDictionary(name, function (context) {
      context.stack.push(value);
    });
  }

  function startDefinition(name) {
    currentDefinition = { name: name, actions: [] };
  }

  function endDefinition() {
    compileAndAddToDictionary(currentDefinition.name, currentDefinition.actions);
    currentDefinition = null;
  }

  function addActionToCurrentDefinition(action) {
    if (action.code === ";") {
      endDefinition();
    } else {
      currentDefinition.actions.push(action);
    }
  }

  function executeRuntimeAction(tokenizer, action, next) {
    switch (action.code) {
    case "variable":
      createVariable(tokenizer.nextToken().value);
      break;
    /*
    case "syscall": // Neo blockchain only
    {
      var sname = tokenizer.nextToken().value;
      if(sname == "Neo.Learn.Execute") // special syscall 
      {
        // invoke tokenizer on read string
        // ????????? TODO
        var str = context.stack.pop();
        next(str);
      }
      else // regular syscalls
        invokeNeoSyscall(sname);
    
      break;
    }
    */
    case "constant":
      createConstant(tokenizer.nextToken().value, context.stack.pop());
      break;
    case ":":
      startDefinition(tokenizer.nextToken().value);
      break;
    default:
      if (action.length == 2) { // has next callback
        action(context, next);
      } else {
        next(action(context));
      }
      return;
    }

    next("");
  }

  // Read a line of input. Callback is called with output for this line.
  function readLine(line, outputCallback, next) {
    if (!next) {
      next = outputCallback;
      outputCallback = null;
    }
    context.addOutput = outputCallback || function () {};
    var tokenizer = Tokenizer(line);

    // processNextToken recursively executes tokens
    function processNextToken() {
      var nextToken = tokenizer.nextToken();

      if (!nextToken) { // reached end of line
        if (!currentDefinition) { // don't append output while definition is in progress
          context.addOutput(" HALT");
        }
        next();
        return;
      }

      var action = tokenToAction(nextToken)

      if (currentDefinition) { // Are we currently defining a definition?
        addActionToCurrentDefinition(action);
        processTokens();
      } else {

        executeRuntimeAction(tokenizer, action, function (output) {
          context.addOutput(output);

          if (context.pause) {
            context.onContinue = processTokens;
          } else {
            processTokens();
          }
        });
      }
    }

    function processTokens() {
      try {
        processNextToken();
      } catch (e) {
        currentDefinition = null;
        context.addOutput(" " + e.message);
        next();
      }
    }

    processTokens();
  }

  function readLines(codeLines, callbacks, next) {
    if (callbacks && !next) {
      next = callbacks;
      callbacks = null;
    }

    if (codeLines.length == 0) {
      next();
      return;
    }

    var codeLine = codeLines[0]

    callbacks && callbacks.lineCallback(codeLine);
    readLine(codeLine, callbacks && callbacks.outputCallback, function () {
      readLines(codeLines.slice(1), callbacks, next);
    });
  }

  addPredefinedWords(addToDictionary, readLines, function () {
    next({
      readLine: readLine,
      readLines: readLines,
      keydown: function (keyCode) {
        context.memory.setValue(context.memory.getVariable("last-key"), keyCode);
        context.keydown && context.keydown(keyCode);
      },
      getStack: function () {
        return context.stack.print();
      },
      getReturnStack: function () {
        return context.returnStack.print();
      },
      setMemoryHandler: function (cb) {
        context.onMemoryChange = function (address, value) {
          cb(address, value, context.memory.getVariable("graphics"));
        };
      }
    });
  });
}

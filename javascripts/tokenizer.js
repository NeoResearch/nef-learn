'use strict';

function Tokenizer(input) {
  var index = 0;
  var length = input.length;
  var stringMode = false;
  var whitespace = /\s+/;
  var validToken = /\S+/;

  function skipWhitespace() {
    while (whitespace.test(input[index]) && index < length) {
      index++;
    }
  }

  // Does input have these characters at this index?
  function hasCharsAtIndex(tokens, startIndex) {
    for (var i = 0; i < tokens.length; i++) {
      if (input[startIndex + i] != tokens[i]) {
        return false;
      }
    }
    return true;
  }

  function processString() {
    var value = "";
    if(input[index+1] == "\"") // ." or s"
      index += 3; // skip over ." and space
    else
      index += 10; //  syscall."
    
    while (input[index] !== '"' && index < length) {
      value += input[index];
      index++;
    }
    index++; // skip over final "
    return value;
  }

  function processParenComment() {
    index += 2; // skip over ( and space
    while (input[index] !== ')' && index < length) {
      index++;
    }

    index++; // skip over final )
  }

  function processNormalToken() {
    var value = "";
    while (validToken.test(input[index]) && index < length) {
      value += input[index];
      index++;
    }
    return value;
  }

  function getNextToken() {
    skipWhitespace();
    var isStringLiteral = hasCharsAtIndex('." ', index);
    // TODO: make PR on isStringPushLiteral
    var isStringPushLiteral = hasCharsAtIndex('s" ', index); // TODO: contributed part on StringPushLiteral s"
    // don't know if here or elsewhere... keep it here for now!! TODO: NR
    var isNeoSyscallLiteral = hasCharsAtIndex('syscall" ', index); 
    var isParenComment = hasCharsAtIndex('( ', index);
    var isSlashComment = hasCharsAtIndex('\\ ', index);

    var value = "";

    if (isStringLiteral || isStringPushLiteral || isNeoSyscallLiteral) { // TODO: contributed part on StringPushLiteral s"
      value = processString();
    } else if (isParenComment) {
      processParenComment();
      return getNextToken(); // ignore this token and return the next one
    } else if (isSlashComment) {
      value = null
    } else {
      value = processNormalToken();
    }

    if (!value) {
      return null;
    }

    return {
      value: value,
      isStringLiteral: isStringLiteral,
      isStringPushLiteral : isStringPushLiteral ,// TODO: contributed part on StringPushLiteral s"
      isNeoSyscallLiteral : isNeoSyscallLiteral // TODO: crazy literal here
    };
  }

  function nextToken() {
    return getNextToken();
  }

  return {
    nextToken: nextToken
  };
}

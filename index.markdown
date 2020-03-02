---
layout: default
---

<div markdown="1" class="toc">
  * toc
  {:toc}
</div>

## Introduction

This tutorial intends to teach you the basics of [Neo Blockchain Virtual Machine](https://github.com/neo-project/neo-vm), usually called NeoVM (or NVM).
NeoVM is a [stack-based machine](https://en.wikipedia.org/wiki/Stack_machine) for processing Smart Contract applications (and also transaction verifications) on [Neo Blockchain](https://neo.org), inspired by many successful stack languages like [Bitcoin Script](https://en.bitcoin.it/wiki/Script), [Microsoft CIL](https://en.wikipedia.org/wiki/Common_Intermediate_Language), [Java Virtual Machine](https://en.wikipedia.org/wiki/Java_virtual_machine) and, finally, the [FORTH language](https://en.wikipedia.org/wiki/Forth_(programming_language)).

FORTH is older of these languages, being proposed in 1970 by [Chuck Moore](https://en.wikipedia.org/wiki/Charles_H._Moore), currently maintained by [Forth Inc](forth.com) and many independent implementations, such as [Gforth](https://www.gnu.org/software/gforth/) and also this nice website/javascript implementation by <a href="https://twitter.com/skilldrick">Nick Morgan</a> called [EasyForth](https://github.com/skilldrick/easyforth).
Stack languages have many [practical applications](https://www.forth.com/resources/forth-apps/), specially due to their simplicity, and easier verification for code correctness (specially on a deterministic environment such as a blockchain).

_(*) If you are new on the Stack Programming world, we strongly recommend reading more on [Stack Data Structure](https://en.wikipedia.org/wiki/Stack_(abstract_data_type)) first. If you are curious on FORTH stack machine, we also recommend [EasyForth tutorial](https://skilldrick.github.io/easyforth)._

_(**) The NVM/FORTH implementation of this tutorial is taken from NeoResearch [nvm-forth project](https://github.com/neoresearch/nvm-forth)._

## Neo3 Stack Items

NeoVM supports seven different types of stack items (UNDER UPDATE).
* Integers: which are in fact Big Integers with positive/negative values limited to 32-bytes (or 256 bits)
* Byte Arrays: general byte arrays
* Booleans: a true/false value
* Arrays: an array can contain a collection of other stack items, including more Arrays (_important: this is a reference type, not value type_)
* Structs: similar to an array, it can contain several stack items inside it (_struct is a value type_)
* Maps: a map can contain a byte array mapping from a key to a value, that may be another stack item
* Interop Interfaces: these stack items are only meant to used for interoperating with high-level implementations of NeoVM, such as NeoContract (the Application Engine for Neo Blockchain)

### Integer

The (Big)Integers on NeoVM3 are represented as little-endian bytearrays with unlimited size (up to computer memory). The serialization is performed as follows:
* If number is positive, represent it as a bytearray (in little-endian order), and if MSb Most-Significant-bit (in little-endian) is set to 1, you will need to put an extra MSByte 0x00. Example: 255 -> 0xff -> 0b'11111111' -> 0xff00 (I'm doing by head, please correct if I'm mistaken).
* If number is negative, represent it as positive little-endian bytearray representation, and take two's-complement (MSb will always be 1, indicating that number is negative). Example: -1 -> 0b'00000001' -> 0b'11111110'+1 -> 0b'11111111' -> 0xff.

Since MSB zeroes are always stripped, the representation size of value zero is in fact 0 (0x'' empty bytearray).

### NVM Opcodes

A NeoVM program is called _script_ (or _NeoVM script_), which is composed by several operations (called _opcodes_). Each opcode has a unique number and a unique name, in order to identify the operation.
**For example:** opcode named `PUSH1`, number 81 (in hex, `81 = 0x51`), generates the number 1; opcode named `ADD`, number 147 (in hex, `147 = 0x93`) adds two numbers.

## Push Some Numbers

All information needs to be on NeoVM stack in order to be processed.
For example, if you want to add two numbers, first you need to put them on the stack.
One difference from other languages is that you need to _first put the operands, and then put the operation_, e.g., operation `1 + 2` is done as `1 2 +` on a stack machine (_put one, put two, then sum the top two elements_).
Where is the result of the operation stored? Again, the result of the operation is also put back on the stack.

### `push1-push16` (opcodes `0x51-0x60`)

Let's try it on practice! Type (don't copy-paste) the following into the
interpreter, typing `Enter` after each line.

    PUSH1
    PUSH2
    PUSH3

{% include editor.html neovm=true %}

What happened? Every time you type a line followed by the `Enter` key, the NVM opcode is executed (state `HALT` means that no errors happened during NeoVM execution).
You should also notice that as you execute each line, the area at the
top fills up with numbers.
That area is our visualization of the stack. It
should look like this:

{% include stack.html stack="1 2 3" %}

Now, into the same interpreter, try the opcode `ADD` followed by the `Enter` key. The top two
elements on the stack, `2` and `3`, have been replaced by `5`.

{% include stack.html stack="1 5" %}

At this point, your editor window should look like this:

<div class="editor-preview editor-text">push1  <span class="output">HALT</span>
push2  <span class="output">HALT</span>
push3  <span class="output">HALT</span>
add  <span class="output">HALT</span>
</div>

Type `ADD` again and press `Enter`, and the top two elements will be replaced by `6`. 
If you try `ADD` one more time NVM would abort execution, because it will try to pop the top two elements off the
stack, even though there's only _one_ element on the stack! This results in a
`FAULT` state on NeoVM:

<div class="editor-preview editor-text">push1  <span class="output">HALT</span>
push2  <span class="output">HALT</span>
push3  <span class="output">HALT</span>
add  <span class="output">HALT</span>
add  <span class="output">HALT</span>
add  <span class="output">FAULT (caused by Stack Underflow)</span>
</div>

You can also write everything in a single line and press `Enter`:

    push10 push3 add

{% include editor.html neovm=true size="small"%}

The main stack now looks like this:

{% include stack.html stack="13" %}

### `push0` and `pushm1` (opcodes `0x00` and `0x4f`)

Other useful push opcodes are `push0`, that pushes `0` to stack, and `pushm1`, that pushes `-1` to stack. Values over `16` (up to 32 bytes) can be pushed in other ways (see NVM `pushdata` for more information).

### Polish notation and multiplication

This style, where the operator appears after the operands, is known as
[Reverse-Polish
notation](https://en.wikipedia.org/wiki/Reverse_Polish_notation). 
Let's try to calculate `10 * (5 + 2)`.
You will need also need a multiplication opcode, which is called `MUL` (opcode number `149 = 0x95`).
Try the following:

    push5 push2 add push10 mul

{% include editor.html neovm=true size="small"%}

The execution in NeoVM follows the order of opcodes in the given NVM script.
This way, no parentheses is needed to perform any kind of arithmetic operation.

## Arithmetic operations

You can play with basic arithmetic operations:
* ADD (opcode `0x93`): adds two numbers on stack
* SUB (opcode `0x94`): subtracts two numbers on stack 
* MUL (opcode `0x95`): multiplies two numbers on stack 
* DIV (opcode `0x96`): divides two numbers on stack (integer division)
* MOD (opcode `0x97`): divides two numbers on stack and puts the rest on stack

### Exercises 

**Exercise:** How do you calculate `(3 * (5 - 6) + 15 / 2) mod 3` on NeoVM? What is the expected result?

{% include editor.html neovm=true size="small"%}

**Solution:** result should be `1`.

First step is: `(5 - 6)`. It can be computed using opcodes: `push5 push6 sub`.
Result `-1` should be put on stack, after consuming operands `5` and `6`.

{% include stack.html stack="-1" %}

Second step is: `3 * (5 - 6)`. Since `(5 - 6)` is already on stack, you just need to push number 3 and multiply: `push3 mul`. Stack should contain `-3` now.

{% include stack.html stack="-3" %}

Third step: let's leave `-3` there, because we need to compute `15 / 2` now.
How do we do that? Simple, just `push15 push2 div`. Our stack must have two values now: `-3` and `7` (integer division of 15 and 2).

{% include stack.html stack="-3 7" %}

Fourth step: expression `(3 * (5 - 6) + 15 / 2)` can be computed now. 
We already have the result of `3 * (5 - 6)` and `15 / 2` on stack, so we just `add`.
Number `4` should be on top of the stack now.

{% include stack.html stack="4" %}

Finally, we perform the division by 3 and take the rest: `push3 mod`. Result should be `1`.

{% include stack.html stack="1" %}

Let's review the whole operations (step-by-step) and the result on stack: 
    `push5 push6 sub push3 mul push15 push2 div add push3 mod`

{% include editor.html neovm=true size="small"%}

<div class="editor-preview editor-text">push5 <span class="output">HALT</span>
push6  <span class="output">HALT</span>
sub  <span class="output">HALT</span>
push3  <span class="output">HALT</span>
mul  <span class="output">HALT</span>
push15  <span class="output">HALT</span>
push2  <span class="output">HALT</span>
div  <span class="output">HALT</span>
add  <span class="output">HALT</span>
push3  <span class="output">HALT</span>
mod  <span class="output">HALT</span>
</div>
{% include stack.html stack="1" %}

**Exercise:** How do you calculate `15 / (12 / 4)` using NeoVM opcodes?

{% include editor.html neovm=true size="small"%}

**Solution:** result should be `5`.

Try to solve it and make sure this is well understood before proceeding to next section ;)

### Push Bytes and Push Data

How to push a number bigger than 16? How to push a _string_ to the stack?

On NeoVM, opcode `PUSHBYTES1` (code `0x01`) pushes a single byte to the stack.
For example, `PUSHBYTES1 21` (or `0x0121`) would push hex value `21` (decimal `33`) to the stack.
There are versions of this opcode until `PUSHBYTES75` (code `0x4B`), that allows pushing 75 bytes to the stack. After that, one can use `PUSHDATA1` (opcode `0x4C`), that pushes up to `255` bytes; `PUSHDATA2` (opcode `0x4D`), that pushes up to `2^16` bytes; and `PUSHDATA4` (opcode `0x4E`), up to `2^32` bytes.

In our web implementation of `nvm-forth`, we can use FORTH string push (instead of `pushbytes` or `pushdata`), which works in the following way:

<div class="editor-preview editor-text">s" sometext" <span class="output">HALT</span>
</div>
{% include stack.html stack="sometext" %}

The text is pushed in ASCII, which is equivalent to a sequence of bytes on NeoVM. 

_(*) one difference not covered here is that on NeoVM all byte arrays can be converted to integers, but here they are only used as text._

**Next section:** this invites us to a next section, string operations.

### String operations

Useful string operations on NeoVM are: `cat`, `left`, `right`, `substr`.

### `cat` (opcode `0x7e`)

`cat` concatenates top stack elements. Example:

    s" hello" s" world" cat 

{% include editor.html neovm=true size="small" %}

Resulting stack:

{% include stack.html stack="helloworld" %}

_(*) this opcode and other string operators are still not implemented in this web mode for testing. See [neo-vm](https://github.com/neo-project/neo-vm) for more information._

## Stack Operations

NeoVM inherits several operations from Forth language, specially those connected to stack operations. Let's take a look at some of them.

### `dup` (opcode `0x76`)

`dup` duplicates the top element of the stack. Example:

    push1 push2 push3 dup

{% include editor.html neovm=true size="small" %}

Resulting stack:

{% include stack.html stack="1 2 3 3" %}

### `drop` (opcode `0x75`)

`drop` removes the top element of the stack. Example:

    push1 push2 push3 drop

Resulting stack:

{% include stack.html stack="1 2" %}

### `swap` (opcode `0x7c`)

`swap` simply swaps the top two elements of the stack. Example:

    push1 push2 push3 push4 swap

Resulting stack:

{% include stack.html stack="1 2 4 3" %}

### `over` (opcode `0x78`)

`over` takes the **second** element from the top of the
stack and duplicates it to the top of the stack. Example:

    push1 push2 push3 over

Resulting stack:

{% include stack.html stack="1 2 3 2" %}

### `rot` (opcode `0x7b`)

`rot` applied a "rotation" the **top three** elements of the stack. Example:

    push1 push2 push3 push4 push5 push6 rot

Resulting stack:

{% include stack.html stack="1 2 3 5 6 4" %}

### Exercises

**Exercise:** try to calculate `15 / (12 / 4)`, starting with `push12` operation.

**Exercise:** practice stack opcodes a little bit.

{% include editor.html neovm=true size="small"%}

In next sections, we will see stack opcodes that receive parameters from stack.

### `pick` (opcode `0x79`)

`pick` reads `n` and copies `n`-th element to top stack. Example:

    push1 push2 push3 push4 push2 pick

Resulting stack:

{% include stack.html stack="1 2 3 4 2" %}

### `roll` (opcode `0x7a`)

`roll` reads `n` and moves `n`-th element to top stack. Example:

    push1 push2 push3 push4 push2 roll

Resulting stack:

{% include stack.html stack="1 3 4 2" %}


### Exercises 

**Exercise:** Consider stack `1 2 3 4 5 6 7 <- top`, how can you put `2` after `6` (and before `7`)? How many stack operations are needed? 

_Result should be `1 3 4 5 6 2 7 <- top`._

{% include editor.html neovm=true size="small"%}

**Solution:** this can be done on two operations.

First, `roll` the `5`-th element to the top stack.

<div class="editor-preview editor-text">push5 <span class="output">HALT</span>
roll  <span class="output">HALT</span>
</div>

{% include stack.html stack="1 3 4 5 6 7 2" %}

Second, `swap` top elements.

{% include stack.html stack="1 3 4 5 6 2 7" %}

**Exercise:** Is there any other way to do it, even if it costs more operations? (_challenge: try to use `tuck` instead of `swap`_)

## Double-Stack model

NeoVM includes a _double-stack_ design, so we need operations also for both the Evaluation Stack (which we've seen already) and the Alternative Stack.

On FORTH language, this stack is called _return stack_, and it is only used for loops and other temporary storages, since it also stores the execution return pointer. This limits the _return stack_ usage, since loops can interfere in stack operations, that's why FORTH also includes a _global storage map_. Although, NeoVM doesn't have a global storage map, it can successfully execute operations only using two stacks and by using arrays as temporary storage (will be explored in later sections).

Next sections will show important double-stack operations.

### `toaltstack` (opcode `0x6b`)

`toaltstack` moves top element (from Evaluation Stack) and moves it to the Alternative Stack. Example:

    push1 push2 push3 toaltstack

Evaluation Stack: 
{% include stack.html stack="1 2" %}

Alternative Stack:
{% include stack.html stack="3" %}

{% include editor.html altstack=true neovm=true size="small"%}

### `fromaltstack` (opcode `0x6c`)

`fromaltstack` moves top element from Alternative Stack and moves it to the Evaluation Stack (the Main Stack). Example:

    push1 push2 toaltstack push3 fromaltstack

Evaluation Stack: 
{% include stack.html stack="1 3 2" %}

Alternative Stack:
{% include stack.html stack="" %}


### `dupfromaltstack` (opcode `0x6a`)

`dupfromaltstack` copies top element from Alternative Stack to the Evaluation Stack. Example:

    push1 push2 toaltstack push3 dupfromaltstack

Evaluation Stack: 
{% include stack.html stack="1 3 2" %}

Alternative Stack:
{% include stack.html stack="2" %}

### Exercises 

**Exercise:** Consider an altstack with value `1` (just run `push1 toaltstack`). What does the instructions `fromaltstack dup toaltstack push5 add` do? Try to re-write them with a small number of opcodes.

{% include editor.html altstack=true neovm=true size="small"%}



## Arrays

Arrays are fundamental tools for complex NVM scripts.
They allow you to store _indexed access_, which is very useful to implement the behavior of local and global variables. 

How do you create an Array?

### `newarray` (opcode `0xc5`)

`newarray` gets top element `n` (from Evaluation Stack) and creates a `n`-sized array. Example:

    push2 newarray

{% include stack.html stack="1578" %}

Wait, what is this number pushed on stack? Our example considers `1578` (but it may be different) as it represents a _memory pointer_ where to find the array (in local memory).

### `arraysize` (opcode `0xc0`)

What can you do with an Array/pointer? First, you can push its size to stack. Example:

    push2 newarray arraysize

{% include stack.html stack="2" %}

Note that the array is consumed during the process, so you may need to `dup` it before using this. 
Practice a little bit:

{% include editor.html neovm=true size="small"%}

How do we store information on a array?

### `setitem` (opcode `0xc4`)

Opcode `setitem` consumes an Array pointer `p`, an index `i` and a value `v` from stack, and performs the following attribution: `(*p)[i] = v`.
So, after that, value `v` is stored at index `i` of `p`, and nothing is put back on stack (note that array is consumed in this operation, remember to `dup` it).

How do we get information from an Array position?

### `pickitem` (opcode `0xc3`)

Opcode `pickitem` consumes an Array pointer `p` and an index `i` stack, and puts back on stack the value stored at position `i` of the Array.

### Exercises

**Exercise:** Try to create a 2-sized array, and store values `10` and `15` in its first positions.

{% include editor.html neovm=true size="small"%}

**Solution:**

First step is `push2 newarray`, so you get an array on stack.
Let's verify its size, so perform `dup arraysize` and you should get `2` on top stack.

{% include stack.html stack="1578 2" %}

You can `drop` value `2` now.

<div class="editor-preview editor-text">push2 newarray <span class="output">HALT</span>
dup arraysize  <span class="output">HALT</span>
drop  <span class="output">HALT</span>
</div>

{% include stack.html stack="1578" %}


Second step is to define the position and value to store on array for a `setitem`.
Since array is consumed during `setitem`, we need to dup it first. 
So, to store `10` on position `0` (over existing array on stack) we do: `dup push0 push10 setitem`. 

{% include stack.html stack="1578" %}

Looks like nothing happened, but trust me, value `10` is somehow inside this array pointer ;)

Let's repeat the process for value `15` on position `1` (try to do it by yourself before proceeding):

{% include editor.html neovm=true size="small"%}

Ok, a summary of what we have done until now:

<div class="editor-preview editor-text">push2 newarray <span class="output">HALT</span>
dup arraysize  <span class="output">HALT</span>
drop  <span class="output">HALT</span>
dup push0 push10 setitem <span class="output">HALT</span>
dup push1 push15 setitem <span class="output">HALT</span>
</div>

{% include stack.html stack="1578" %}

Now, let's play a little bit, and extract values from the array.
For example, getting value at index `0` is easy using `pickitem`: `dup push0 pickitem`.
We should get a nice `10` on top of the stack:

<div class="editor-preview editor-text">dup push0 pickitem <span class="output">HALT</span>
</div>

{% include stack.html stack="1578 10" %}

Let's drop the `10` and try to get the value at index `1` (try by yourself before proceeding):

{% include editor.html neovm=true size="small"%}

Final solution (step by step):

<div class="editor-preview editor-text">push2 newarray <span class="output">HALT</span>
dup push0 push10 setitem <span class="output">HALT</span>
dup push1 push15 setitem <span class="output">HALT</span>
dup push0 pickitem <span class="output">HALT</span>
drop <span class="output">HALT</span>
dup push1 pickitem <span class="output">HALT</span>
</div>

{% include stack.html stack="1578 15" %}

**Exercise:** Try to put values `10` and `15` in the array (like previous example), and then swap both elements inside it (position `0` will have value `15`, and position `1` will have value `10`).

**Next section:**
Let's see how an Array can be useful for storing data on multiple stacks.

## Value and Reference types

One interesting property of the Array stack item is its ability to allow side-effects, since it is a _reference type_ (in constrast to the _value types_ of Integer stack items).

When an Integer is copied on NeoVM, both become completely independent entities:

<div class="editor-preview editor-text">push10 dup <span class="output">HALT</span>
</div>

{% include stack.html stack="10 10" %}

If you add one to the top integer, nothing will happen to the other one (in fact, a new integer is always created after any arithmetic operation):

<div class="editor-preview editor-text">push10 dup <span class="output">HALT</span>
push1 add <span class="output">HALT</span>
</div>

{% include stack.html stack="10 11" %}

However, when an array is copied, in fact, its pointer is copied:

<div class="editor-preview editor-text">push2 newarray dup <span class="output">HALT</span>
</div>

{% include stack.html stack="1578 1578" %}

{% include editor.html neovm=true size="small"%}

So, this is called a _reference type_, because any change performed on top array will reflect automatically on the other array (remember last Array exercise on how `pickitem` and `setitem` work).

### Parameter Packing Pattern

One pattern found in compilers is how they manage to pack and store parameters in local variables.
Consider the following C# function:
```cs
void test(int x1, int x2);
```
The function has two parameters, and suppose it was invoked as `test(10, 15)`, thus generating two local variables for `x1` and `x2` in a internal array.
One solution for this, is having the following opcodes: `PUSH2 NEWARRAY TOALTSTACK DUPFROMALTSTACK PUSH0 PUSH2 ROLL SETITEM DUPFROMALTSTACK PUSH1 PUSH2 ROLL SETITEM`.

Feel free to try it (remeber to `push15 push10` first):

{% include editor.html altstack=true neovm=true size="small"%}

Step by step, this is what happens:
```
    evstack    |        pending commands        |  altstack
_______________|________________________________|____________
15 10          | push2 newarray ...             |
15 10 [_,_]    | toaltstack dupfromaltstack ... |
15 10 [_,_]    | push0 push2 ...                | [_,_]
15 10 [_,_] 0 2| roll ...                       | [_,_]
15 [_,_] 0 10  | setitem ...                    | [_,_]
15             | dupfromaltstack push1 push2 ...| [10,_]
15 [10,_] 1 2  | roll  ...                      | [10,_]
[10,_] 1 15    | setitem ...                    | [10,_]
               | ...                            | [10,15]
```

To inspect what happened, use the following commands to get array from altstack and pick inside it:
`dupfromaltstack 0 pickitem` (gets first element), `drop`, `dupfromaltstack 1 pickitem` (gets second element).

{% include editor.html altstack=true neovm=true size="small"%}

**Exercise:** replace the code above (`PUSH2 NEWARRAY TOALTSTACK DUPFROMALTSTACK PUSH0 PUSH2 ROLL SETITEM DUPFROMALTSTACK PUSH1 PUSH2 ROLL SETITEM`) by a much simpler operation.

### Managing Execution Parameters

Let's see a practical application of having local parameters.
Consider C# function:
```cs
void test(int x1, int x2)
{
    x1 = 2*x1 + x2; // compute 2 times x1 plus x2 and store on x1
}
```

Suppose local variables (`x1=10`, `x2=15`) are already loaded on altstack via `push15 push10 push2 pack toaltstack`.
The desired operation (`x1=2*x1+x2`) could be performed using the following opcodes: `PUSH2  DUPFROMALTSTACK PUSH0 PICKITEM MUL DUPFROMALTSTACK PUSH1 PICKITEM ADD DUPFROMALTSTACK PUSH0 PUSH2 ROLL SETITEM`.

**Exercise:** execute the following code, step by step (remember to load parameters on altstack first).

{% include editor.html altstack=true neovm=true size="small"%}

**Solution:**

First step, `push2` pushed value `2` to evaluation stack (it will be used later on multiplication).

{% include stack.html stack="2" %}

Then, `DUPFROMALTSTACK PUSH0 PICKITEM` extract first parameter from the array at altstack, with value `10`.

{% include stack.html stack="2 10" %}

Opcode `mul` performs the multiplication:

{% include stack.html stack="20" %}

Second step, after calculation of `2*x1`, we will calculate `2*x1 + x2`. We need to get `x2`:
`DUPFROMALTSTACK PUSH1 PICKITEM` (value of `x2` is `15`).

{% include stack.html stack="20 15" %}

Opcode `add` performs the sum:

{% include stack.html stack="35" %}

Finally, we need to store the result of `2*x1 + x2` back on `x1`. Opcodes `DUPFROMALTSTACK PUSH0 PUSH2 ROLL SETITEM` do the job.

**Summary:** to run the complete example, type this:

<div class="editor-preview editor-text">push15 push10 <span class="output">HALT</span>
PUSH2 NEWARRAY TOALTSTACK <span class="output">HALT</span>
DUPFROMALTSTACK PUSH0 PUSH2 ROLL SETITEM <span class="output">HALT</span>
DUPFROMALTSTACK PUSH1 PUSH2 ROLL SETITEM <span class="output">HALT</span>
push2 <span class="output">HALT</span>
DUPFROMALTSTACK PUSH0 PICKITEM <span class="output">HALT</span>
mul <span class="output">HALT</span>
DUPFROMALTSTACK PUSH1 PICKITEM <span class="output">HALT</span>
add <span class="output">HALT</span>
DUPFROMALTSTACK PUSH0 PUSH2 ROLL SETITEM <span class="output">HALT</span>
</div>

To check that result was actually stored on the array, just do:
<div class="editor-preview editor-text">dupfromaltstack push0 pickitem <span class="output">HALT</span>
</div>

Stack should contain `35`:

{% include stack.html stack="35" %}

{% include editor.html altstack=true neovm=true size="small"%}

**Challenge:** This code can be actually compiled and tested on [NeoCompiler Eco (neocompiler.io)](https://neocompiler.io), generating the following opcodes (in hex): `52-c5-6b-6a-00-52-7a-c4-6a-51-52-7a-c4-52-6a-00-c3-95-6a-51-c3-93-6a-00-52-7a-c4-61-6c-75-66`.
Use the disassembly options from the website to inspect and understand how compilation process work for NeoVM.

## Syscalls ("Hello World!")

NeoVM is a lightweight stack computing engine, used to interoperate with higher levels of Neo blockchain.
Interoperability can be achieved by means of `syscall` opcode (code `0x68`), that receives a _interop command_ as parameter. This is implemented here as a string literal `syscall"`.

Neo blockchain defines several interop calls, which are not available here in this simplified tutorial (just the NeoVM part is covered here). 
However, we illustrate such capability with some interop commands (just available in NVM Learn platform):
- `syscall" Neo.Learn.Notify"`
- `syscall" Neo.Learn.Log"`
- `syscall" Neo.Learn.Sleep"`
- `syscall" Neo.Learn.Random"`
- `syscall" Neo.Learn.Call"` (see next section on Snake game)

`Neo.Learn.Notify"` takes one element from stack and prints it on the web browser via alert system.
A **very interesting** "Hello World" example can be done in the following way:

<div class="editor-preview editor-text">s" Hello World" <span class="output">HALT</span>
syscall" Neo.Learn.Notify" <span class="output">HALT</span>
</div>

Note the space between `s"` and `Hello World!"`, this is necessary for string parsing on FORTH stack language (used in this tutorial).

{% include editor.html altstack=true neovm=true size="small"%}

If you have a desktop-based browser, you can also try `Neo.Learn.Log`, which puts content on browser console log system.

Other interesting syscalls here are: `Neo.Learn.Sleep`, that reads an input from stack and sleeps during this given time (in milliseconds); and `Neo.Learn.Random`, that generates a random number between `0` and stack top value.

**Example:** try pushing `16` to the stack (via `push16`) and counting how many times `syscall" Neo.Learn.Random"` takes to make this value become zero ;)

A **possible** outcome is:

<div class="editor-preview editor-text">push16 <span class="output">HALT</span>
</div>

{% include stack.html stack="16" %}

<div class="editor-preview editor-text">syscall" Neo.Learn.Random" <span class="output">HALT</span>
</div>

{% include stack.html stack="7" %}

<div class="editor-preview editor-text">syscall" Neo.Learn.Random" <span class="output">HALT</span>
</div>

{% include stack.html stack="5" %}

<div class="editor-preview editor-text">syscall" Neo.Learn.Random" <span class="output">HALT</span>
</div>

{% include stack.html stack="3" %}

<div class="editor-preview editor-text">syscall" Neo.Learn.Random" <span class="output">HALT</span>
</div>

{% include stack.html stack="0" %}


## A NVM snake game

Time to have (even more) fun! Let's use NeoVM to run a Snake game ;)

The code of the game is pre-loaded (which is somewhat large), and it contains instructions from both NeoVM and FORTH language (still an ongoing work to completely remove all FORTH opcodes).
The game is originally made by [Nick Morgan](https://twitter.com/skilldrick) as part of the [EasyForth tutorial](https://skilldrick.github.io/easyforth).


The game works by binding some NVM _local/global variables_ into graphics and key operations (in a similar way that Neo syscalls work).

To start the game you will need to call the `start` function (a FORTH definition).
To achieve that, push string `start` to stack using `s" start"` and invoke it, via `syscall" Neo.Learn.Call"`. You can use the arrow keys to move the snake ;)

Simply type below (don't copy and paste):
<div class="editor-preview editor-text">s" start" <span class="output">HALT</span>
syscall" Neo.Learn.Call" <span class="output">HALT</span>
</div>

{% include editor.html altstack=true neovm=true canvas=true game=true %}

## Learn more

This tutorial intends to teach only the basics of NeoVM, in a interactive way, but you can always dig more directly on [NeoVM project](https://github.com/neo-project/neo-vm).
One important topic is not covered, but an explanation is given below.

### Conditionals, Loops and Function Calls

Conditionals and loops are implemented on NeoVM via the use o jumps.
Basically, a jump changes the current instruction counter and moves it to another 
position in the _NVM script_, affecting which operations will be read after that.
Since this is not directly related to the stack execution model, it will only be covered in future tutorials.

### Acknowledgements

This tutorial is a _non-standard_ implementation of both NeoVM and also Forth language, which are both much more powerful than presented here.
In special, the Snake game is a hybrid NVM/FORTH adaptation of the one proposed on EasyForth tutorial, and we are greatly grateful for this to be made available on GitHub.
If you are a Forth or NeoVM expert, feel free to contribute!

Follow us on GitHub and Twitter ;)

**NeoResearch Community**

![NeoResearch](./images/butterfly-05-final.png)

![NeoSmartEconomy](./images/neo_logo.svg)

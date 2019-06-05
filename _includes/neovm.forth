\ FORTH implementation of NeoVM 2.x (Neo Blockchain Virtual Machine)
\ fast tutorial on forth: https://learnxinyminutes.com/docs/forth
\ https://yosefk.com/blog/my-history-with-forth-stack-machines.html
\ https://www.complang.tuwien.ac.at/forth/gforth/Docs-html/Characters-and-Strings-Tutorial.html
\ -----------------------------------------------------------
\ usage: online application https://neoresearch.io/nvm-learn/
\ locally on linux you can install gforth (apt install gforth)
\ however, FORTH syntax is not standard for both interpreters
\ this is meant to work only on the web application above
\ -----------------------------------------------------------

\ ================
\ define constants
\ ================

\ create empty bytearray
\variable empty 0 cells allot 
\ pushes empty bytearray to stack
\: push0 empty @ ;
\ for now, pushing ZERO instead of empty array... TODO: improve this
: push0 0 ;                          \ 0x00
: pushf push0 ;

\ push value -1 on main stack
: pushm1 -1 ;                        \ 0x4f
\ unused
\                                    \ 0x50                                       
\ push value 1 on main stack
: push1 1 ;                          \ 0x51
\ push value 1 on main stack
: pusht push1 ;                      \ 0x51
\ push value 2 on main stack
: push2 2 ;                          \ 0x52
\ push value 3 on main stack
: push3 3 ;                          \ 0x53
\ push value 4 on main stack
: push4 4 ;                          \ 0x54
\ push value 5 on main stack
: push5 5 ;                          \ 0x53
\ push value 6 on main stack
: push6 6 ;                          \ 0x53
\ push value 7 on main stack
: push7 7 ;                          \ 0x53
\ push value 8 on main stack
: push8 8 ;                          \ 0x53
\ push value 9 on main stack
: push9 9 ;                          \ 0x59
\ push value 10 on main stack
: push10 10 ;                        \ 0x5a
\ push value 11 on main stack
: push11 11 ;                        \ 0x5b
\ push value 12 on main stack
: push12 12 ;                        \ 0x5c
\ push value 13 on main stack
: push13 13 ;                        \ 0x5d
\ push value 14 on main stack
: push14 14 ;                        \ 0x5e
\ push value 15 on main stack
: push15 15 ;                        \ 0x5f
\ push value 16 on main stack
: push16 16 ;                        \ 0x60


\ ===========
\ control ops
\ ===========
\ nop: no operation
: nop ;                              \ 0x61

\ skip jumps, skip calls

\ skip ret

\ skip appcals, syscalls, tail call


\ ==========
\ stack ops
\ ==========

\ note: using return stack (rstack) as alternative stack. perhaps better using another software stack

\ dupfromaltstack 0x6a (defined after)

\ move data to alternative stack
: toaltstack >r ;                    \ 0x6b

\ move data from alternative stack
: fromaltstack >r ;                  \ 0x6c

\ duplicate data from alternative stack (implemented here after others, dup is native)
: dupfromaltstack fromaltstack dup tostackstack  ;  \ 0x6a


\ move data to alternative stack
: toaltstack >r ;                    \ 0x6b



: nvm.dup dup ;  \ 0x76


\ : nvm.xdrop   \todo

\ : nvm.depth depth ; \ 0x74

\ : move3 ( count -- ) 3 0 do dup . >r r@ loop 3 0 do r@ r> loop  ;



\ inc 0x8b (defined after add)
\ dec 0x8c (defined after sub)

\ sign 8d (IF)

\ negate 8f (IF)

\ abs 90 (IF)

\ not 91 (IF)

\ nz 92 (IF)

\ add values on main stack
: add + ;                        \ 0x93

\ subtract values on main stack
: sub - ;                        \ 0x94

\ adds 1 to the input (defined here because of add)
: inc 1 add ;                    \ 0x8b

\ subtracts 1 from the input (defined here because of sub)
: dec 1 sub ;                    \ 0x8c

\ multiply values on main stack
: mul * ;                        \ 0x95

\ a is divided by b
: div / ;                        \ 0x96

\ mod (native)                   \ 0x97

\ shl (c# bigint) 0x98

\ shr (c# bigint) 0x99

\ booland (IF) 0x9a

\ boolor (IF) 0x9b

\ Returns 1 if the numbers are equal, 0 otherwise (note that forth true is -1)
: numequal = -1 mul ;              \ 0x9c

\ 9d reserved ?

\ Returns 1 if the numbers are not equal, 0 otherwise. (note that forth true is -1)
: numnotequal = 1 add ;            \ 0x9e

\ Returns 1 if a is less than b, 0 otherwise. (note that forth true is -1)
: lt < -1 mul ;            \ 0x9f

\ Returns 1 if a is greater than b, 0 otherwise. (note that forth true is -1)
: gt > -1 mul ;            \ 0xa0

\ lte (IF ? OR? <= ?)   \ 0xa1

\ gte (IF ? OR? >= ?)   \ 0xa2

\ Returns the smaller of a and b. \ 0xa3
\ min (native)

\ Returns the larger of a and b. \ 0xa4
\ max (native)

\ Returns 1 if x is within the specified range (left-inclusive), 0 otherwise.
\ WITHIN = 0xA5,


\ bye

\ clean page (command implemented manually)
page
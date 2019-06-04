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

: nvm.dupfromaltstack r> dup >r	 ; \ won't work because >r should be used together with r>

: nvm.toaltstack >r ;    \ won't work due to missing r>

: nvm.fromaltstack r> ;  \ won't work due to missing >r

: nvm.dup dup ;  \ 0x76


\ : nvm.xdrop   \todo

\ : nvm.depth depth ; \ 0x74

\ : move3 ( count -- ) 3 0 do dup . >r r@ loop 3 0 do r@ r> loop  ;



\ bye

\ clean page (command implemented manually)
page
section .text
global _start
_L1x:
	push rbp
	mov rbp, rsp
	
	push 3
	
	pop rbp
	ret

_start:
	push rbp
	mov rbp, rsp
	

	xor rax, rax
	pop rbp

	mov rax, 60
	mov rdi, 0
	syscall

	ret

segment .bss
mem: resb 640000

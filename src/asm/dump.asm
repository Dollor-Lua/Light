dump:
        push    rbp
        mov     rbp, rsp

        mov     rdi, [rbp+16]

        push    rbx
        mov     rbx, rdi
        sub     rsp, 48
        mov     BYTE [rsp+23], 10
        test    rdi, rdi
        js      .L12
.L2:
        mov     rdi, -3689348814741910323
        mov     rax, rbx
        mul     rdi
        shr     rdx, 3
        lea     rax, [rdx+rdx*4]
        mov     rcx, rdx
        add     rax, rax
        sub     rbx, rax
        add     ebx, 48
        mov     BYTE [rsp+22], bl
        test    rdx, rdx
        je      .L4
        mov     rax, rdx
        mul     rdi
        shr     rdx, 3
        lea     rax, [rdx+rdx*4]
        mov     rsi, rdx
        add     rax, rax
        sub     rcx, rax
        add     ecx, 48
        mov     BYTE [rsp+21], cl
        test    rdx, rdx
        je      .L5
        mov     rax, rdx
        mul     rdi
        mov     rcx, rdx
        shr     rcx, 3
        lea     rax, [rcx+rcx*4]
        add     rax, rax
        sub     rsi, rax
        add     esi, 48
        mov     BYTE [rsp+20], sil
        test    rcx, rcx
        je      .L6
        mov     rax, rcx
        mul     rdi
        mov     rsi, rdx
        shr     rsi, 3
        lea     rax, [rsi+rsi*4]
        add     rax, rax
        sub     rcx, rax
        add     ecx, 48
        mov     BYTE [rsp+19], cl
        test    rsi, rsi
        je      .L7
        mov     rax, rsi
        mul     rdi
        shr     rdx, 3
        lea     rax, [rdx+rdx*4]
        mov     rcx, rdx
        add     rax, rax
        sub     rsi, rax
        add     esi, 48
        mov     BYTE [rsp+18], sil
        test    rdx, rdx
        je      .L8
        mov     rax, rdx
        mul     rdi
        mov     rsi, rdx
        shr     rsi, 3
        lea     rax, [rsi+rsi*4]
        add     rax, rax
        sub     rcx, rax
        add     ecx, 48
        mov     BYTE [rsp+17], cl
        test    rsi, rsi
        je      .L9
        mov     rax, rsi
        mul     rdi
        shr     rdx, 3
        lea     rax, [rdx+rdx*4]
        mov     edx, 8
        add     rax, rax
        sub     rsi, rax
        add     esi, 48
        mov     BYTE [rsp+16], sil
.L3:
        mov     eax, 8
        mov     edi, 1
        sub     rax, rdx
        lea     rsi, [rsp+16+rax]
        mov     rax, 1
        syscall
        add     rsp, 48
        pop     rbx

        pop     rbp
        ret
.L12:
        mov     edx, 1
        lea     rsi, [rsp+15]
        mov     edi, 1
        neg     rbx
        mov     BYTE [rsp+15], 45
        mov     rax, 1
        syscall
        jmp     .L2
.L8:
        mov     edx, 6
        jmp     .L3
.L4:
        mov     edx, 2
        jmp     .L3
.L5:
        mov     edx, 3
        jmp     .L3
.L6:
        mov     edx, 4
        jmp     .L3
.L7:
        mov     edx, 5
        jmp     .L3
.L9:
        mov     edx, 7
        jmp     .L3
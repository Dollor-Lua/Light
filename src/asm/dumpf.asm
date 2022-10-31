dumpf:  ; Function begin
        push    r12                                     ; 0000 _ 41: 54
        pxor    xmm1, xmm1                              ; 0002 _ 66: 0F EF. C9
        xor     ecx, ecx                                ; 0006 _ 31. C9
        push    rbp                                     ; 0008 _ 55
        push    rbx                                     ; 0009 _ 53
        sub     rsp, 288                                ; 000A _ 48: 81. EC, 00000120
        movups  oword [rsp+10H], xmm1                   ; 0011 _ 0F 11. 4C 24, 10
        movups  oword [rsp+20H], xmm1                   ; 0016 _ 0F 11. 4C 24, 20
        movups  oword [rsp+30H], xmm1                   ; 001B _ 0F 11. 4C 24, 30
        movups  oword [rsp+40H], xmm1                   ; 0020 _ 0F 11. 4C 24, 40
        movups  oword [rsp+50H], xmm1                   ; 0025 _ 0F 11. 4C 24, 50
        movups  oword [rsp+60H], xmm1                   ; 002A _ 0F 11. 4C 24, 60
        movups  oword [rsp+70H], xmm1                   ; 002F _ 0F 11. 4C 24, 70
        movups  oword [rsp+80H], xmm1                   ; 0034 _ 0F 11. 8C 24, 00000080
        pxor    xmm1, xmm1                              ; 003C _ 66: 0F EF. C9
        comisd  xmm1, xmm0                              ; 0040 _ 66: 0F 2F. C8
        jbe     ?_001                                   ; 0044 _ 76, 0D
        xorpd   xmm0, oword [.LC_DUMPF1]                  ; 0046 _ 66: 0F 57. 05, 00000000(rel)
        mov     ecx, 1                                  ; 004E _ B9, 00000001
?_001:  cvttsd2si edx, xmm0                             ; 0053 _ F2: 0F 2C. D0
        pxor    xmm1, xmm1                              ; 0057 _ 66: 0F EF. C9
        lea     rdi, [rsp+10H]                          ; 005B _ 48: 8D. 7C 24, 10
        xor     esi, esi                                ; 0060 _ 31. F6
        mov     r9, rdi                                 ; 0062 _ 49: 89. F9
        cvtsi2sd xmm1, edx                              ; 0065 _ F2: 0F 2A. CA
        subsd   xmm0, xmm1                              ; 0069 _ F2: 0F 5C. C1
?_002:  movsxd  rax, edx                                ; 0070 _ 48: 63. C2
        mov     r8d, edx                                ; 0073 _ 41: 89. D0
        add     r9, 1                                   ; 0076 _ 49: 83. C1, 01
        imul    rax, rax, 1717986919                    ; 007A _ 48: 69. C0, 66666667
        sar     r8d, 31                                 ; 0081 _ 41: C1. F8, 1F
        sar     rax, 34                                 ; 0085 _ 48: C1. F8, 22
        sub     eax, r8d                                ; 0089 _ 44: 29. C0
        lea     r8d, [rax+rax*4]                        ; 008C _ 44: 8D. 04 80
        add     r8d, r8d                                ; 0090 _ 45: 01. C0
        sub     edx, r8d                                ; 0093 _ 44: 29. C2
        mov     r8d, esi                                ; 0096 _ 41: 89. F0
        add     esi, 1                                  ; 0099 _ 83. C6, 01
        add     edx, 48                                 ; 009C _ 83. C2, 30
        mov     byte [r9-1H], dl                        ; 009F _ 41: 88. 51, FF
        mov     edx, eax                                ; 00A3 _ 89. C2
        test    eax, eax                                ; 00A5 _ 85. C0
        jnz     ?_002                                   ; 00A7 _ 75, C7
        movsd   xmm1, qword [rel .LC_DUMPF2]                  ; 00A9 _ F2: 0F 10. 0D, 00000000(rel)
        mulsd   xmm0, xmm1                              ; 00B1 _ F2: 0F 59. C1
        mulsd   xmm0, xmm1                              ; 00B5 _ F2: 0F 59. C1
        mulsd   xmm0, xmm1                              ; 00B9 _ F2: 0F 59. C1
        mulsd   xmm0, xmm1                              ; 00BD _ F2: 0F 59. C1
        mulsd   xmm0, xmm1                              ; 00C1 _ F2: 0F 59. C1
        mulsd   xmm0, xmm1                              ; 00C5 _ F2: 0F 59. C1
        mulsd   xmm0, xmm1                              ; 00C9 _ F2: 0F 59. C1
        mulsd   xmm0, xmm1                              ; 00CD _ F2: 0F 59. C1
        mulsd   xmm0, xmm1                              ; 00D1 _ F2: 0F 59. C1
        mulsd   xmm0, xmm1                              ; 00D5 _ F2: 0F 59. C1
        mulsd   xmm0, xmm1                              ; 00D9 _ F2: 0F 59. C1
        mulsd   xmm0, xmm1                              ; 00DD _ F2: 0F 59. C1
        mulsd   xmm0, xmm1                              ; 00E1 _ F2: 0F 59. C1
        mulsd   xmm0, xmm1                              ; 00E5 _ F2: 0F 59. C1
        mulsd   xmm0, xmm1                              ; 00E9 _ F2: 0F 59. C1
        movsd   xmm1, qword [rel .LC_DUMPF3]                  ; 00ED _ F2: 0F 10. 0D, 00000000(rel)
        comisd  xmm0, xmm1                              ; 00F5 _ 66: 0F 2F. C1
        jnc     ?_009                                   ; 00F9 _ 0F 83, 00000161
        cvttsd2si r9, xmm0                              ; 00FF _ F2 4C: 0F 2C. C8
?_003:  mov     byte [rsp+110H], 0                      ; 0104 _ C6. 84 24, 00000110, 00
        pxor    xmm0, xmm0                              ; 010C _ 66: 0F EF. C0
        movsxd  rbx, esi                                ; 0110 _ 48: 63. DE
        lea     rbp, [rsp+90H]                          ; 0113 _ 48: 8D. AC 24, 00000090
        lea     r10, [rsp+91H]                          ; 011B _ 4C: 8D. 94 24, 00000091
        mov     r11d, r8d                               ; 0123 _ 45: 89. C3
        movups  oword [rsp+90H], xmm0                   ; 0126 _ 0F 11. 84 24, 00000090
        add     rdi, rbx                                ; 012E _ 48: 01. DF
        movups  oword [rsp+0A0H], xmm0                  ; 0131 _ 0F 11. 84 24, 000000A0
        mov     rax, rbp                                ; 0139 _ 48: 89. E8
        add     r11, r10                                ; 013C _ 4D: 01. D3
        movups  oword [rsp+0B0H], xmm0                  ; 013F _ 0F 11. 84 24, 000000B0
        movups  oword [rsp+0C0H], xmm0                  ; 0147 _ 0F 11. 84 24, 000000C0
        movups  oword [rsp+0D0H], xmm0                  ; 014F _ 0F 11. 84 24, 000000D0
        movups  oword [rsp+0E0H], xmm0                  ; 0157 _ 0F 11. 84 24, 000000E0
        movups  oword [rsp+0F0H], xmm0                  ; 015F _ 0F 11. 84 24, 000000F0
        movups  oword [rsp+100H], xmm0                  ; 0167 _ 0F 11. 84 24, 00000100
        nop                                             ; 016F _ 90
?_004:  movzx   edx, byte [rdi-1H]                      ; 0170 _ 0F B6. 57, FF
        add     rax, 1                                  ; 0174 _ 48: 83. C0, 01
        sub     rdi, 1                                  ; 0178 _ 48: 83. EF, 01
        mov     byte [rax-1H], dl                       ; 017C _ 88. 50, FF
        cmp     rax, r11                                ; 017F _ 4C: 39. D8
        jnz     ?_004                                   ; 0182 _ 75, EC
        test    r9, r9                                  ; 0184 _ 4D: 85. C9
        je      ?_007                                   ; 0187 _ 0F 84, 00000090
        mov     byte [rsp+rbx+90H], 46                  ; 018D _ C6. 84 1C, 00000090, 2E
        lea     r12d, [r8+2H]                           ; 0195 _ 45: 8D. 60, 02
        mov     esi, 1                                  ; 0199 _ BE, 00000001
        lea     rbx, [rsp+4FH]                          ; 019E _ 48: 8D. 5C 24, 4F
        mov     r11, qword 0CCCCCCCCCCCCCCCDH           ; 01A3 _ 49: BB, CCCCCCCCCCCCCCCD
?_005:  mov     rax, r9                                 ; 01B0 _ 4C: 89. C8
        mul     r11                                     ; 01B3 _ 49: F7. E3
        mov     rax, r9                                 ; 01B6 _ 4C: 89. C8
        shr     rdx, 3                                  ; 01B9 _ 48: C1. EA, 03
        lea     rdi, [rdx+rdx*4]                        ; 01BD _ 48: 8D. 3C 92
        add     rdi, rdi                                ; 01C1 _ 48: 01. FF
        sub     rax, rdi                                ; 01C4 _ 48: 29. F8
        mov     edi, esi                                ; 01C7 _ 89. F7
        add     eax, 48                                 ; 01C9 _ 83. C0, 30
        mov     byte [rbx+rsi], al                      ; 01CC _ 88. 04 33
        mov     rax, r9                                 ; 01CF _ 4C: 89. C8
        add     rsi, 1                                  ; 01D2 _ 48: 83. C6, 01
        mov     r9, rdx                                 ; 01D6 _ 49: 89. D1
        cmp     rax, 9                                  ; 01D9 _ 48: 83. F8, 09
        ja      ?_005                                   ; 01DD _ 77, D1
        movsxd  r12, r12d                               ; 01DF _ 4D: 63. E4
        movsxd  rax, edi                                ; 01E2 _ 48: 63. C7
        lea     esi, [rdi-1H]                           ; 01E5 _ 8D. 77, FF
        add     r10, r12                                ; 01E8 _ 4D: 01. E2
        lea     rdx, [rsp+rax+50H]                      ; 01EB _ 48: 8D. 54 04, 50
        lea     rax, [rbp+r12]                          ; 01F0 _ 4A: 8D. 44 25, 00
        mov     rdi, rsi                                ; 01F5 _ 48: 89. F7
        add     r10, rsi                                ; 01F8 _ 49: 01. F2
?_006:  movzx   esi, byte [rdx-1H]                      ; 0200 _ 0F B6. 72, FF
        add     rax, 1                                  ; 0204 _ 48: 83. C0, 01
        sub     rdx, 1                                  ; 0208 _ 48: 83. EA, 01
        mov     byte [rax-1H], sil                      ; 020C _ 40: 88. 70, FF
        cmp     r10, rax                                ; 0210 _ 49: 39. C2
        jnz     ?_006                                   ; 0213 _ 75, EB
        lea     esi, [r8+rdi+3H]                        ; 0215 _ 41: 8D. 74 38, 03
        movsxd  rbx, esi                                ; 021A _ 48: 63. DE
?_007:  lea     eax, [rsi+1H]                           ; 021D _ 8D. 46, 01
        mov     byte [rsp+rbx+90H], 10                  ; 0220 _ C6. 84 1C, 00000090, 0A
        lea     ebx, [rsi+2H]                           ; 0228 _ 8D. 5E, 02
        cdqe                                            ; 022B _ 48: 98
        mov     byte [rsp+0FH], 45                      ; 022D _ C6. 44 24, 0F, 2D
        mov     byte [rsp+rax+90H], 0                   ; 0232 _ C6. 84 04, 00000090, 00
        test    ecx, ecx                                ; 023A _ 85. C9
        jnz     ?_010                                   ; 023C _ 75, 3A
?_008:  movsxd  rdx, ebx                                ; 023E _ 48: 63. D3
        mov     rsi, rbp                                ; 0241 _ 48: 89. EE
        mov     edi, 1                                  ; 0244 _ BF, 00000001
        mov rax, 1
        syscall
        add     rsp, 288                                ; 024E _ 48: 81. C4, 00000120
        pop     rbx                                     ; 0255 _ 5B
        pop     rbp                                     ; 0256 _ 5D
        pop     r12                                     ; 0257 _ 41: 5C
        ret                                             ; 0259 _ C3
?_009:  subsd   xmm0, xmm1                              ; 0260 _ F2: 0F 5C. C1
        cvttsd2si r9, xmm0                              ; 0264 _ F2 4C: 0F 2C. C8
        btc     r9, 63                                  ; 0269 _ 49: 0F BA. F9, 3F
        jmp     ?_003                                   ; 026E _ E9, FFFFFE91
?_010:  lea     rsi, [rsp+0FH]                          ; 0278 _ 48: 8D. 74 24, 0F
        mov     edx, 1                                  ; 027D _ BA, 00000001
        mov     edi, 1                                  ; 0282 _ BF, 00000001
        mov rax, 1
        syscall
        jmp     ?_008                                   ; 028C _ EB, B0
;;-- SPLIT-SECTION DATA --;;
.LC_DUMPF1:                                                   ; oword
        dq 8000000000000000H                            ; 0000 _ -0.0 
        dq 0000000000000000H                            ; 0008 _ 0.0 
.LC_DUMPF2:                                                   ; qword
        dq 4024000000000000H                            ; 0000 _ 10.0 
.LC_DUMPF3:
        dq 43E0000000000000H                            ; 0008 _ 9.223372036854776E+18 
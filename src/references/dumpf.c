// dumpf.c written by Fynotix
// built for creating dumpf.asm as you need c to make asm easily

#include <unistd.h>
#include <stdio.h>

void dumpf(double x) {
    char buf[64] = {};
    char bufB[64] = {0};
    int bufSize = 0;
    int bufBSize = 0;

    int neg = 0;

    if (x < 0) { neg = 1; x = -x; }

    int ipart = (int)x;
    double dpartA = x - (double)ipart;

    do { buf[bufSize] = ipart % 10 + '0'; bufSize++; ipart /= 10;  } while(ipart);

    // doubles on average have 15 decimals of precision, floats are 7.
    // its okay if we get too much precision, it'll just show as trailing 0s.
    int integerLength = 15;
    do { integerLength--; dpartA *= 10; } while (integerLength);
    unsigned long long dpart = (unsigned long long)dpartA;

    int temp = bufSize;
    char newBuf[129] = {}; // 64 + 64 + 1 (decimal)
    do { newBuf[bufSize - temp] = buf[temp - 1]; temp--; } while(temp);

    if (dpart > 0) {
        newBuf[bufSize] = '.';
        bufSize++;
        do { bufB[bufBSize] = dpart % 10 + '0'; bufBSize++; dpart /= 10; integerLength++; } while(dpart);
        temp = bufBSize;
        int preBufSz = bufSize;
        do { newBuf[preBufSz + bufBSize - temp] = bufB[temp - 1]; temp--; bufSize++; } while(temp);
    }

    newBuf[bufSize] = '\n';
    newBuf[bufSize + 1] = '\0';
    bufSize += 2;
    char minus = '-';
    if (neg) write(1, &minus, 1);
    write(1, &newBuf, bufSize);
}
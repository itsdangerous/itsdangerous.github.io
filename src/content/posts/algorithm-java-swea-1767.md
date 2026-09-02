---
title: "[Algorithm | Java] SWEA-1767 : 프로세서 연결하기"
description: "SWEA-1767 : 프로세서 연결하기 SW Expert AcademySW 프로그래밍 역량 강화에 도움이 되는 다양한 학습 컨텐츠를 확인하세요!swexpertacademy.com풀이 방법1. DFS로 모든 프로세스에 대해 4방향(상, 우, 하, 좌)을 조사한다2. 각 방향마다 가장자리까지 연결을 시도한다 2-1. 연결을 시도하며 [전선 길이의 합]을 저장해주어야 한다 2-2. 모든 경우와 비교하기 위해, 배열을 복사하는 방법 대신 원본 배열에 Marking, UnMarking 과정을 수행한다.3. 최대 깊이까지 들어갔을 때 [연결된 프로세스 수]와 [전선 길이의 합]을 비교한다Idea처음에는 프로세스가 어느 한 방향으로 연결을 시도할 때 만약 다른 전선이 겹치면 어떻게 해결해야하지?란 생각에 막혔.."
pubDate: 2023-03-02T13:22:58.000Z
category: "Algorithm"
tags: ["algorithm","dfs","Java","swea 1767","알고리즘"]
slug: "algorithm-java-swea-1767"
sourceUrl: "https://0418.tistory.com/21"
draft: false
---
**SWEA-1767 : 프로세서 연결하기**

[SW Expert Academy SW 프로그래밍 역량 강화에 도움이 되는 다양한 학습 컨텐츠를 확인하세요! swexpertacademy.com](https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=AV4suNtaXFEDFAUf&categoryId=AV4suNtaXFEDFAUf&categoryType=CODE&problemTitle=1767&orderBy=FIRST_REG_DATETIME&selectCodeLang=ALL&select-1=&pageSize=10&pageIndex=1&&&&&&&&&) > **풀이 방법**
>
> **1. DFS로 모든 프로세스에 대해 4방향(상, 우, 하, 좌)을 조사한다**
>
> **2. 각 방향마다 가장자리까지 연결을 시도한다**
> **2-1. 연결을 시도하며 \[전선 길이의 합\]을 저장해주어야 한다**
> **2-2. 모든 경우와 비교하기 위해, 배열을 복사하는 방법 대신 원본 배열에 Marking, UnMarking 과정을 수행한다.**
>
> **3. 최대 깊이까지 들어갔을 때 \[연결된 프로세스 수\]와 \[전선 길이의 합\]을 비교한다**

## **Idea**

**처음에는 프로세스가 어느 한 방향으로 연결을 시도할 때 만약 다른 전선이 겹치면 어떻게 해결해야하지?란 생각에 막혔다.**

**그리고 프로세스의 개수가 많아야 한다는 조건, 전선의 길이가 작아야 한다는 조건... 정말 까다로웠다.**

**하지만 하나씩 차근차근 풀어나가면 충분히 풀 수 있는 문제였다.**

**이 문제의 포인트는 다음과 같다.**

**1. DFS로 각 프로세서를 방문과 동시에 전선을 연결해주고**

**\[연결에 성공한 프로세서의 수\]와 \[전선의 길이\]를 동시에 저장해주는 것**

**2. 각 경우의 수에 대해 비교하기 위해, 프로세스에 번호가 있다고 가정하고 \[번호+2\] 로 원본 배열에 Marking, UnMarking 과정 수행**

**2번이 무슨 말이냐 하면~**

![](/images/posts/algorithm-java-swea-1767/06c34c8e7c7b92b37e7c.png) **이렇게 프로세스가 4개가 있다고 하고**

**방향을 (상, 우, 하 ,좌)의 순서로 준다고 하면,**

**제일 처음 제일 깊게 들어갔을 때는 다음과 같은 상태가 된다.**

![](/images/posts/algorithm-java-swea-1767/e09e37f4b16aae83dde1.png) **제일 밑에서부터 빠져 나오면서 4방향을 마저 탐색해야하는데, 그 다음 상태는 아래와 같다.**

![](/images/posts/algorithm-java-swea-1767/391f5622b90c4476dc9c.png) **그 다음은**

![](/images/posts/algorithm-java-swea-1767/e469f70b8bc80647ff7e.png) **이렇게 되겠지**

**위에 그림들 한 장 한 장이 경우의 수인데, 이것들을 그리기 위해서 2가지 방법을 생각했었다**

**1. 배열 복사**

**2. Marking******

**원본 배열을 복사하면 메모리를 많이 사용하여 메모리 초과가 날 수도 있기 때문에******

**나는 Map에 Marking을 하고, 그걸 지워주는 방식으로 해결했다******

**다시 처음으로 돌아가서,**

**i번째**(1 \<= i \<= N)**에 방문한 프로세서를 i번이라고 보고**

**그 프로세서가 연결한 전선의 경로를 (i+2)로 마킹해준다면 다음과 같은 그림이 된다.**

![](/images/posts/algorithm-java-swea-1767/25ab93a7e595f9611092.png) **프로세서의 번호는 실제 Map에서는 1로 되어있으니 걱정할 필요없다.**

**이 다음 과정은 아래와 같다******

![](/images/posts/algorithm-java-swea-1767/a1f50ece76fdfaec4c05.png) **이렇게 전선을 그려주었다 지워주고 다시 그려준다면 메모리 낭비없이 모든 경우에 대해서 완전 탐색을 수행할 수 있다.**

**여기까지가 이 문제의 핵심이다!**

## **Code**

```
/*
[swea_1767] 프로세서 연결하기
https://swexpertacademy.com/main/code/problem/problemDetail.do?contestProbId=AV4suNtaXFEDFAUf&
*/

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.StringTokenizer;

public class swea_1767 {
static int N, R, cntProcess, cntLines;
static int[][] map;
static ArrayList<int[]> processors;
static int[] dr = {-1, 0, 1, 0};
static int[] dc = {0, 1, 0, -1};

public static void main(String[] args) throws IOException {
BufferedReader br = new BufferedReader(new InputStreamReader(System.in));

int T = Integer.parseInt(br.readLine());

for (int t = 1; t <= T; t++) {
N = Integer.parseInt(br.readLine());
map = new int[N][N];
cntLines = Integer.MAX_VALUE;
cntProcess = Integer.MIN_VALUE;
R = 0;

// 프로세서 입력 받기
processors = new ArrayList<>();
for (int i = 0; i < N; i++) {
StringTokenizer st = new StringTokenizer(br.readLine());
for (int j = 0; j < N; j++) {
map[i][j] = Integer.parseInt(st.nextToken());
if (map[i][j] == 1) {
// if(i == 0 || j == 0 || i == N-1 || j == N-1) continue;
processors.add(new int[]{i, j});
R++;
}
}
}

dfs(0, 0, 0);

System.out.printf("#%d %d\n", t, cntLines);
}
}

static void dfs(int cnt, int connected, int total) {

if (connected + (R - cnt) < cntProcess) return;

if (cnt == R) {
if (cntProcess < connected) {
cntProcess = connected;
cntLines = total;

}
else if (cntProcess == connected) {
cntLines = Math.min(cntLines, total);
}
return;
}

for (int i = 0; i < 4; i++) {
int t = markLine(processors.get(cnt)[0], processors.get(cnt)[1], i, cnt + 2);
if (t != -1) {
dfs(cnt + 1, connected + 1, total + t);
}
else {
dfs(cnt + 1, connected, total);
}
unmarkLine(processors.get(cnt)[0], processors.get(cnt)[1], i, cnt + 2);
}
}

static boolean check(int r, int c) {
return 0 <= r && r < N && 0 <= c && c < N;
}

static int markLine(int r, int c, int d, int mark) {
int cnt = 0;
if (r == 0 || c == 0 || r == N-1 || c == N-1) return cnt;

int nr = r + dr[d];
int nc = c + dc[d];

while (check(nr, nc)) {
if (map[nr][nc] != 0) {
unmarkLine(r, c, d, mark);
return -1;
}
map[nr][nc] = mark;
cnt++;
nr += dr[d];
nc += dc[d];
}
return cnt;
}

static void unmarkLine(int r, int c, int d, int mark) {
if (r == 0 || c == 0 || r == N-1 || c == N-1) {
return;
}
int nr = r + dr[d];
int nc = c + dc[d];
while (check(nr, nc)) {
if (map[nr][nc] != mark) return;
map[nr][nc] = 0;
nr += dr[d];
nc += dc[d];
}
}
}
```

**markLine 메서드는 프로세서의 인덱스와 방향, 그리고 프로세서 번호를 받아 그 방향에 대해 marking해준다.**

**만약 marking 도중에 다른 선과 겹치거나 다른 프로세서를 만나는 경우에는 그렸던 것을 다 지워줘야하기 때문에**

**unmarkLine메서드를 추가했다.**

**unmarkLine 메서드는 그린 것을 지워주는 기능이다.**

> **map을 입력 받을 때 가장자리에 있는 프로세서는 개수에서 제외해야한다.**
>
> **주어지는 N의 크기가 7~12이고,**
> **가능한 프로세서의 최대 수는 12개이기 때문에**
> **최악의 경우에는 4^12가지의 경우의 수가 나온다. **그래서 최대한 가장자리에 있는 프로세서는 이미 연결되었다고 생각하고, 나머지 프로세서에 대해서만 생각해주고******dfs문의 기저조건으로**
> **만약 \[현재까지 탐색한 프로세서의 수\]와 \[앞으로 탐색해야할 프로세서의 수\]의 합이 \[현재 시점에 저장된 최대 프로세서의 수\]보다 작다면 어차피 그 이후는 '최대한 많은 프로세서를 연결'이란 조건을 충족시키지 못하기 때문에 Pruning해주면 성능은 훨씬 빨라진다.**

###

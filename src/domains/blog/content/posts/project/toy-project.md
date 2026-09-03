---
title: "[Toy Project] 채소 가격 데이터 시각화"
description: "KAMIS의 일별 농산물 가격을 Python 크롤링으로 수집하고 데이터베이스에 저장·시각화하는 토이 프로젝트를 소개"
pubDate: 2022-11-02T01:18:42.000Z
category: "project"
tags: ["Crawling","mysql","python"]
slug: "toy-project"
draft: false
---
## **일별 가격 데이터 수집 \[Crwaling\]**

파이썬으로 구현해보았습니다.

[농산물유통정보:::KAMIS](https://www.kamis.or.kr/customer/main/main.do)

홈페이지에서 bs4를 이용하여 크롤링하였습니다.

원래는 API로 데이터 받아서 사용했는데 이게... 1년치까지밖에 못쓴다고 합니다.. 그래서 크롤링으로 사이트에 무리가 가지 않는 선에서 천천히 데이터를 DB에 쌓고 프로젝트를 진행 중입니다 ㅋㅋ

```

import pandas as pd
import requests
from bs4 import BeautifulSoup as bs
from sqlalchemy import create_engine
import sqlalchemy
import collections
import datetime


collections.Callable = collections.abc.Callable
pd.set_option('mode.chained_assignment',  None)

#db 연결 설정
name = 'db 이름'
endpoint = 'db host'
pwd = 'db password'
port = '3306'
db_name = 'db name'

engine = create_engine(f'mysql+mysqldb://{name}:{pwd}@{endpoint}:{port}/{db_name}')
conn = engine.connect()



#날짜 설정(원하는 날짜 설정 가능 저는 현재 날짜로 했습니다.)
today = datetime.datetime.today()
day = datetime.date(2012,1,1)
year = day.strftime('20%y')

#크롤링 마지막 날짜 설정

end_day = today.strftime('20%y-%m-%d') # 현재 날짜
#end_day = datetime.date(2011,12,31).strftime(('20%y-%m-%d')) # 설정 날짜


# 자동 크롤링


while 1 :
    year = day.strftime('20%y')
    if day.strftime('20%y-%m-%d') > end_day :
        break

    url_left = 'https://www.kamis.or.kr/customer/price/retail/catalogue.do?action=daily&regday='
    page_day = day.strftime('20%y-%m-%d')
    url_right = '&countycode=2300&itemcategorycode=200&convert_kg_yn=N'

    url = url_left + page_day + url_right

    req=requests.get(url)
    html = req.text
    soup = bs(html, 'html.parser')

    table_html = soup.find('table', {'class' : 'wtable3'})
    table_html = str(table_html)
    table_df_list = pd.read_html(table_html)
    table_df = table_df_list[0]

    df = table_df.iloc[:,[0,1,2,3]]
    df.rename(columns={'구분':'item_name', '구분.1':'item_type', '구분.2':'item_status'}, inplace=True)

    if df.columns[-1][-3:-1] != page_day[-2:] or df.columns[0] == 'Unnamed: 0' :
        next_date = day + datetime.timedelta(days=1)
        day = next_date
        continue

    else :
        distinct = []
        unit = []

        for i in df['item_type'] :
            tmp = i.split('(')
            distinct.append(tmp[0])
            tmp = tmp[1].split(')')
            unit.append(tmp[0])

        df.insert(1, 'item_unit', unit)
        df.loc[:, 'item_type'] = distinct

        df.rename(columns={df.columns[-1] : year + '-'
                           + df.columns[-1][-6:-4] + '-' + df.columns[-1][-3:-1]}, inplace = True)

        df.insert(5, 'price_date', [df.columns[-1]]*len(df))

        df.rename(columns={df.columns[-2] : 'price'}, inplace = True)

        next_date = day + datetime.timedelta(days=1)
        day = next_date

        # DB에 저장할 때, DataType을 지정해줍니다.
        dtypesql = {
               'item_name':sqlalchemy.types.VARCHAR(40),
               'item_unit':sqlalchemy.types.VARCHAR(40),
               'item_type':sqlalchemy.types.VARCHAR(40),
               'item_status':sqlalchemy.types.VARCHAR(40),
               'price':sqlalchemy.types.INT,
               'price_date':sqlalchemy.types.VARCHAR(40)
               }
        # table 이름도 년도에 맞게 생성
        table_name = f'production_{year}'

        # db에 적재
        df.to_sql(name=table_name, con=conn, if_exists = 'append', index=False, dtype = dtypesql)
```

기능은 기준 날짜(start\_day)로부터 목표 날짜(end\_day)까지의 일별 데이터를 품목에 맞게 가져와서 DB에 저장하는 것입니다.

DB는 MySQL을 connection 시켜주었습니다.

위 코드는 start 날짜를 2017년, end 날짜를 2020년으로 한다면 table이 2017, 2018, 2019, 2020 총 4개가 만들어지며 자동으로 데이터가 들어가는 코드입니다.

지금 이 코드로는 매일 데이터를 갱신해주어야 해서 너무 비효율적입니다.

그 날 그 날 데이터를 자동으로 받아서 DB에 적재시키는 방법을 고안해야겠습니다.

코드를 실행하고 다음과 같이 데이터를 모았습니다. ㅎㅎ

![](/images/posts/toy-project/8b9774f416294dfaa552.png)

2010년부터 긁어았죠이제 이 데이터로 어떻게 요리를 할까.. 고민중입니다. ㅋㅋ

저는 KAMIS에 유선통화로 직접 API를 받았으며, 서버에 문제가 되지 않는 선에서 크롤링을 해도 된다는 허락을 받고 진행하였습니다.

다른 분들은 IP차단 당하실 수도 있으니 조심해주시기 바랍니다~~

I want to create a progressive website that can notification XD date and dividend pay date from THAI stocks

Phase 1: getting the core data for this web
steps:
write a automate that scrape data from
https://www.set.or.th/th/market/stock-calendar/x-calendar

data example per ticker

```txt
BAM : บริษัทบริหารสินทรัพย์ กรุงเทพพาณิชย์ จำกัด (มหาชน)
วันขึ้นเครื่องหมาย
05 พ.ค. 2569
วันปิดสมุดทะเบียน
-
วันกำหนดรายชื่อผู้ถือหุ้น
06 พ.ค. 2569
วันจ่ายปันผล
22 พ.ค. 2569
ประเภท
เงินปันผล
เงินปันผล (บาท/หุ้น)
0.50 บาท
รอบผลประกอบการ
01 ม.ค. 2568 - 31 ธ.ค. 2568
เงินปันผลจาก
ปันผลจากกำไรสุทธิ
```

ticker:BAM
stock full name:บริษัทบริหารสินทรัพย์ กรุงเทพพาณิชย์ จำกัด (มหาชน)
xd date:วันขึ้นเครื่องหมาย
book close date:วันปิดสมุดทะเบียน

- stock holder set date:วันกำหนดรายชื่อผู้ถือหุ้น
  dividend pay date:วันจ่ายปันผล
  dividend type:ประเภท
  cash dividend:เงินปันผล
  cash dividend (baht/stock):เงินปันผล (บาท/หุ้น)
  paid period:รอบผลประกอบการ
  dividend from:เงินปันผลจาก
  net profit :ปันผลจากกำไรสุทธิ

proceed all the tickers for the month period since it will show current month and only focus on xd

Phase 2: Display data and user preference
Display XD date and dividend price date on calendar

- A feature to send notification to user mobile if user have subscribed the tickers
- A feature that user can put information of what stocks and how many stocks that user is holding in our web

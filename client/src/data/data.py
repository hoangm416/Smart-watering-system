import csv
from datetime import datetime, timedelta
import random

# Tạo dữ liệu giả
start_date = datetime(2024, 12, 6)
end_date = datetime(2024, 12, 8, 23)  # Đến cuối ngày 8/12
current_time = start_date

data = []
devices = ["Device 1", "Device 2"]  # Tên các thiết bị

while current_time <= end_date:
    for device in devices:
        moisture = random.randint(10, 90)  # Độ ẩm từ 10% đến 90%
        data.append([device, current_time.isoformat(), moisture])
    current_time += timedelta(hours=1)

# Ghi vào file CSV
with open('data.csv', 'w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    writer.writerow(['device', 'createdAt', 'moisture'])  # Header
    writer.writerows(data)

print("File data.csv đã được tạo!")

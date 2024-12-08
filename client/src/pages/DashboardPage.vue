<template>
  <div class="container">
    <div class="dashboard">
      <!-- Humidity Control Section -->
      <div class="humidity-board">
        <div class="humidity-control">
          <div class="selected-device">
            Thiết bị: <span class="device-name">{{ selectedDevice.name || 'Chưa chọn thiết bị' }}</span>
          </div>
          <div class="humidity">
            <div class="humidity-text">
              <div class="humidity-row">
                <div class="humidity-lable">Độ ẩm đất:</div>
                <div class="humidity-value">
                  {{ selectedDevice.moisture !== null ? selectedDevice.moisture : '--' }}
                  <span class="humidity-unit" v-if="selectedDevice.moisture !== null">%</span>
                </div>
              </div>
            </div>
          </div>
          <div class="actions">
            <button @click="waterPlant" class="button-primary">Tưới nước</button>
          </div>
        </div>

        <!-- Form thêm thiết bị mới -->
        <div class="add-device-form">
          <label for="deviceName">Tên thiết bị:</label>
          <input type="text" id="deviceName" v-model="newDevice.name" placeholder="Nhập tên thiết bị" />

          <label for="deviceLocation">Vị trí:</label>
          <input type="text" id="deviceLocation" v-model="newDevice.location" placeholder="Nhập vị trí" />

          <label for="deviceStatus">Trạng thái:</label>
          <select id="deviceStatus" v-model="newDevice.status">
            <option value="100">Hoạt động</option>
            <option value="0">Không hoạt động</option>
          </select>

          <button @click="addDevice" class="button-add">Thêm thiết bị</button>
        </div>
      </div>

      <!-- Devices Table Section -->
      <div class="devices">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Thiết bị</th>
                <th>Vị trí</th>
                <th>Trạng thái</th>
                <th>Độ ẩm</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(device, index) in devices"
                :key="index"
                class="table-row"
                @click="selectDevice(device)"
              >
                <td>{{ device.name }}</td>
                <td>{{ device.location }}</td>
                <td>{{ device.status === '100' ? 'Hoạt động' : 'Không hoạt động' }}</td>
                <td>{{ device.moisture || '--' }}%</td>
                <td>
                  <button @click.stop="editDevice(index)" class="button-edit">Sửa</button>
                  <button @click.stop="deleteDevice(index)" class="button-delete">Xóa</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
  import axios from "axios";
  import Chart from "chart.js/auto";
  import io from "socket.io-client";

  export default {
    name: "DashboardPage",

    data() {
      return {
        devices: [], // Danh sách thiết bị
        selectedDevice: {},
        newDevice: {
          name: "",
          location: "",
          status: "100", // Giá trị mặc định là Hoạt động
          moisture: 0, // Đặt độ ẩm mặc định là 0%
        },
      };
    },

    methods: {
      // Sự kiện khi nhấn nút tưới nước
      async onClickButton() {
        try {
          const response = await axios.post("http://localhost:8080/api/pump/on");
          console.log(response.message);
          alert("Bật máy bơm trong 10 giây.");
        } catch (error) {
          console.log(error);
        }
      },

      // Thêm thiết bị mới
      addDevice() {
        if (this.newDevice.name && this.newDevice.location) {
          const newDevice = {
            ...this.newDevice,
            // moisture: 0, // Đặt độ ẩm ban đầu là 0
          };
          // // Thêm thiết bị vào danh sách thiết bị (giả sử trong thực tế cần gọi API)
          // console.log("Thiết bị mới:", newDevice);
          // this.$emit("add-device", newDevice);
          // Thêm thiết bị mới vào danh sách `devices`
          this.devices.push(newDevice);
          this.resetNewDeviceForm();
        } else {
          alert("Vui lòng nhập đầy đủ thông tin.");
        }
      },
      resetNewDeviceForm() {
        this.newDevice = {
          name: "",
          location: "",
          status: "100",
          moisture: 0
        };
      },

      // Sửa thông tin thiết bị
      editDevice(index) {
        const newName = prompt("Nhập tên mới cho thiết bị:", this.devices[index].name);
        if (newName) this.devices[index].name = newName;
      },

      // Xóa thiết bị
      deleteDevice(index) {
        if (confirm("Bạn có chắc chắn muốn xóa thiết bị này?")) {
          this.devices.splice(index, 1);
        }
      },

      // Chọn thiết bị hiển thị thông tin
      selectDevice(device) {
        this.selectedDevice = { ...device };
      },

      // Vẽ biểu đồ độ ẩm
      renderChart() {
        const ctx = document.getElementById("myChart");
        if (this.chartInstance) this.chartInstance.destroy(); // Xóa biểu đồ cũ nếu tồn tại
        this.chartInstance = new Chart(ctx, {
          type: "line",
          data: {
            labels: this.labels,
            datasets: [
              {
                label: "Độ ẩm đất (%)",
                data: this.moistureData,
                borderWidth: 1,
              },
            ],
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 10,
                },
              },
            },
          },
        });
      },

      // Tưới nước
      waterPlant() {
        alert("Đã thực hiện tưới nước!");
      },
    },

    async mounted() {
      const socket = io("http://localhost:8080", {
        extraHeaders: {
          "Access-Control-Allow-Origin": "*",
        },
      });

      socket.on("connect", () => {
        console.log("Đã kết nối tới máy chủ Socket.IO");
      });

      socket.on("data", (data) => {
        console.log("Nhận được dữ liệu từ máy chủ:", data);
        this.currentDevice = data.deviceId;
        this.moisture = data.moisture;

        // Cập nhật thông tin cho biểu đồ
        this.labels.push(new Date().toLocaleTimeString());
        this.moistureData.push(data.moisture);

        if (this.labels.length > 10) {
          this.labels.shift(); // Xóa nhãn cũ
          this.moistureData.shift(); // Xóa dữ liệu cũ
        }

        this.renderChart(); // Vẽ lại biểu đồ
      });

      socket.on("disconnect", () => {
        console.log("Mất kết nối tới máy chủ Socket.IO");
      });

      this.renderChart(); // Khởi tạo biểu đồ khi trang được tải
    },
  };
</script>


<style scoped>
@import url("@assets/styles/table.css");

.add-device-form {
  width: 40%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.add-device-form input,
.add-device-form select {
  padding: 5px;
  font-size: 14px;
}

.button-add {
  height: 40px;
  min-width: 100px;
  padding: 0 16px;
  background-color: #1fab4d;
  border: none;
  border-radius: 4px;
  box-shadow: 0 0 4px 0 rgba(0, 0, 0, 0.25);
  color: white;
  font-family: "Google Sans", sans-serif;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}
.button-add:hover {
  background-color: #046525;
}

/* Nút sửa với màu nền vàng */
.button-edit {
  background-color: #ffc107; /* Màu vàng */
  color: #fff; /* Chữ màu trắng */
  border: none; /* Xóa viền */
  padding: 8px 12px; /* Kích thước vừa phải */
  border-radius: 4px; /* Bo góc nhẹ */
  font-size: 14px; /* Kích thước chữ vừa phải */
  cursor: pointer; /* Con trỏ dạng nút khi hover */
  transition: background-color 0.3s ease; /* Hiệu ứng mượt khi đổi màu */
}

.button-edit:hover {
  background-color: #e0a800; /* Màu vàng đậm hơn khi hover */
}

/* Nút xóa với màu nền đỏ */
.button-delete {
  background-color: #dc3545; /* Màu đỏ */
  color: #fff; /* Chữ màu trắng */
  border: none; /* Xóa viền */
  padding: 8px 12px; /* Kích thước vừa phải */
  border-radius: 4px; /* Bo góc nhẹ */
  font-size: 14px; /* Kích thước chữ vừa phải */
  cursor: pointer; /* Con trỏ dạng nút khi hover */
  transition: background-color 0.3s ease; /* Hiệu ứng mượt khi đổi màu */
}

.button-delete:hover {
  background-color: #c82333; /* Màu đỏ đậm hơn khi hover */
}

.container {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.dashboard {
  height: calc(100% - 40px - 20px - 17px - 15px);
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
  border-radius: 4px;
}

.humidity-board {
  display: flex;
  justify-content: space-between;
}

.humidity-control {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 0 4px 0 rgba(0, 0, 0, 0.25);
}

.selected-device {
  flex: 1;
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: 500;
}

.device-name {
  margin-left: 50px;
  margin-bottom: 1px;
  font-size: 20px;
  font-weight: 400;
}

.humidity {
  flex: 3;
  display: flex;
  align-items: center;
  margin-top: 12px;
}

.humidity-text {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.humidity-row {
  display: flex;
  align-items: center; /* Đảm bảo cả tiêu đề và giá trị được căn giữa theo chiều dọc */
  gap: 10px; /* Tạo khoảng cách giữa tiêu đề và giá trị */
}

.humidity-lable {
  font-weight: 500;
  font-size: 20px;
}

.humidity-value {
  font-size: 48px;
  color: #007bff;
}

.humidity-unit {
  margin-top: 14px;
  margin-left: 4px;
  font-size: 48px;
  font-weight: 500;
}

.actions {
  flex: 1;
  margin-top: 12px;
}

.button-primary {
  height: 40px;
  min-width: 100px;
  padding: 0 16px;
  background-color: #278ec6;
  border: none;
  border-radius: 4px;
  box-shadow: 0 0 4px 0 rgba(0, 0, 0, 0.25);
  color: white;
  font-family: "Google Sans", sans-serif;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.button-primary:hover {
  background-color: #0e4d81;
}

.humidity-chart {
  flex: 1;
  margin-left: 18px;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 0 4px 0 rgba(199, 189, 189, 0.82);
}

.devices {
  max-height: calc(100% - 258px - 18px);
  margin-top: 18px;
  border-radius: 4px;
  box-shadow: 0 0 4px 0 rgba(211, 194, 194, 0.25);
  overflow: hidden;
}
</style>

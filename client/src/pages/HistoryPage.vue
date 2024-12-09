<template>
  <div class="container">
    <div class="page-title">
      <h1>{{ formatDateDisplay(selectedDate) }}</h1>
      <div class="date-picker">
        <label for="date">Chọn ngày:</label>
        <input type="date" id="date" v-model="selectedDate" @change="filterData" />
        <button @click="filterData">Xem</button>
      </div>
    </div>

    <div class="chart-wrapper">
      <h2>Độ ẩm theo giờ</h2>
      <canvas id="moistureChart"></canvas>
    </div>
  </div>
</template>

<script>
// import axios from "axios";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import Papa from "papaparse";
// import file from "/data.csv"; // Cập nhật đường dẫn nếu cần

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export default {
  name: "HistoryPage",
  data() {
    return {
      moisture: [],
      selectedDate: new Date().toISOString().split("T")[0],
      chartInstance: null,
    };
  },
  methods: {
    async getHistory() {
      const file = "/data.csv" // Cập nhật đường dẫn nếu cần
      try {
        const response = await fetch(file);
        const csvData = await response.text();
        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            this.moisture = results.data.map((item) => ({
              device: item.device,
              createdAt: item.createdAt,
              moisture: parseInt(item.moisture, 10),
            }));
            this.filterData();
          },
        });
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      }
    },

    filterData() {
      const filteredData = this.moisture.filter((item) => {
        const itemDate = this.formatDate(item.createdAt);
        return itemDate === this.selectedDate;
      });

      const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}h`);
      const device1Data = Array(24).fill(0);
      const device2Data = Array(24).fill(0);

      filteredData.forEach((item) => {
        const hour = new Date(item.createdAt).getHours();
        if (item.device === "Device 1") {
          device1Data[hour] = item.moisture;
        } else if (item.device === "Device 2") {
          device2Data[hour] = item.moisture;
        }
      });

      this.updateChart(labels, device1Data, device2Data);
    },

    formatDate(date) {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    },

    formatDateDisplay(date) {
      const d = new Date(date);
      return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
    },

    updateChart(labels, device1Data, device2Data) {
      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      const ctx = document.getElementById("moistureChart").getContext("2d");
      this.chartInstance = new ChartJS(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Device 1",
              data: device1Data,
              borderColor: "orange",
              backgroundColor: "rgba(255,165,0,0.2)",
              fill: true,
            },
            {
              label: "Device 2",
              data: device2Data,
              borderColor: "blue",
              backgroundColor: "rgba(0,0,255,0.2)",
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
            },
          },
        },
      });
    },

  },
  async created() {
    await this.getHistory();
  },
};
</script>

<style scoped>
.container {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.page-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h1 {
  font-size: 28px;
  font-weight: 700;
}

.date-picker {
  display: flex;
  align-items: center;
}

.date-picker label {
  font-size: 18px;
  margin-right: 10px;
}

.date-picker input {
  font-size: 16px;
  padding: 5px 10px;
  margin-right: 10px;
}

.date-picker button {
  font-size: 16px;
  padding: 5px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.date-picker button:hover {
  background-color: #0056b3;
}

.chart-wrapper {
  margin-top: 20px;
}

h2 {
  text-align: center;
  font-size: 22px;
  font-weight: 700;
}

canvas {
  width: 100%;
  height: 400px;
}
</style>

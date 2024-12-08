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
import axios from "axios";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";

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
      try {
        const response = await axios.get("http://localhost:8080/api/moisture");
        this.moisture = response.data;
        this.filterData();
      } catch (error) {
        console.log(error);
      }
    },

    filterData() {
      const filteredData = this.moisture.filter((item) => {
        const itemDate = this.formatDate(item.createdAt);
        return itemDate === this.selectedDate;
      });

      const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}h`);
      const data = Array(24).fill(0);

      filteredData.forEach((item) => {
        const hour = new Date(item.createdAt).getHours();
        data[hour] = item.moisture;
      });

      this.updateChart(labels, data);
    },

    formatDate(date) {
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    },

    formatDateDisplay(date) {
      const d = new Date(date);
      return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
    },

    updateChart(labels, data) {
      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      const ctx = document.getElementById("moistureChart").getContext("2d");
      this.chartInstance = new ChartJS(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Độ ẩm (%)",
              data: data,
              backgroundColor: "#42a5f5",
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

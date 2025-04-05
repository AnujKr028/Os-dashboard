// Global state
let processes = [];
let alerts = [];
let sortBy = 'cpu';
let searchTerm = '';

// Elements
const systemInfoButton = document.getElementById('systemInfoButton');

systemInfoButton.addEventListener('click', () => {
  const systemInfoSection = document.getElementById('systemInfoSection');
  systemInfoSection.classList.remove('hidden');

  // Smooth scroll to the system info section
  systemInfoSection.scrollIntoView({ 
    behavior: 'smooth',
    block: 'end'
  });

  // Fetch system info on open
  fetchSystemInfo();
});

const systemInfoModal = document.getElementById('systemInfoSection');
const closeModalButton = document.getElementById('closeInfoSection');
const sortSelect = document.getElementById('sortSelect');
const searchInput = document.getElementById('searchInput');

// Event listeners
systemInfoButton.addEventListener('click', () => {
  fetchSystemInfo();
  systemInfoModal.classList.remove('hidden');
});

closeModalButton.addEventListener('click', () => {
  systemInfoModal.classList.add('hidden');
});

sortSelect.addEventListener('change', (e) => {
  sortBy = e.target.value;
  fetchProcesses();
});

searchInput.addEventListener('input', (e) => {
  searchTerm = e.target.value.toLowerCase();
  renderProcessTable(processes);
});

// Add this code to handle theme toggling
const themeToggleButton = document.getElementById('themeToggleButton');

// Check and apply saved theme preference
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    themeToggleButton.innerHTML = '<i class="fas fa-moon mr-2"></i> Toggle Theme';
  }
});

themeToggleButton.addEventListener('click', () => {
  const body = document.body;
  body.classList.toggle('light-mode');

  // Save the user's preference
  const theme = body.classList.contains('light-mode') ? 'light' : 'dark';
  localStorage.setItem('theme', theme);

  // Update the icon and text
  if (theme === 'light') {
    themeToggleButton.innerHTML = '<i class="fas fa-moon mr-2"></i> Toggle Theme';
  } else {
    themeToggleButton.innerHTML = '<i class="fas fa-sun mr-2"></i> Toggle Theme';
  }
});

// Fetch system usage data
async function fetchUsage() {
  try {
    const res = await fetch("http://127.0.0.1:5000/api/usage");
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    
    // Update CPU bar
    const cpuPercent = data.cpu.percent;
    const cpuBar = document.getElementById("cpuBar");
    cpuBar.style.width = `${cpuPercent}%`;
    cpuBar.textContent = `${cpuPercent.toFixed(1)}%`;
    cpuBar.className = `h-6 rounded-full text-xs flex items-center justify-center font-bold ${getColorClass(cpuPercent, 'cpu')}`;
    document.getElementById("cpuDetails").textContent = `${data.cpu.cores} cores`;
    
    // Update RAM bar
    const ramPercent = data.ram.percent;
    const ramBar = document.getElementById("ramBar");
    ramBar.style.width = `${ramPercent}%`;
    ramBar.textContent = `${ramPercent.toFixed(1)}%`;
    ramBar.className = `h-6 rounded-full text-xs flex items-center justify-center font-bold ${getColorClass(ramPercent, 'ram')}`;
    document.getElementById("ramDetails").textContent = `${data.ram.used} / ${data.ram.total} GB`;
    
    // Update Disk bar
    const diskPercent = data.disk.percent;
    const diskBar = document.getElementById("diskBar");
    diskBar.style.width = `${diskPercent}%`;
    diskBar.textContent = `${diskPercent.toFixed(1)}%`;
    diskBar.className = `h-6 rounded-full text-xs flex items-center justify-center font-bold ${getColorClass(diskPercent, 'disk')}`;
    document.getElementById("diskDetails").textContent = `${data.disk.used} / ${data.disk.total} GB`;
    
    // Check for resource alerts
    checkResourceAlerts(data);
  } catch (error) {
    console.error("Error fetching usage data:", error);
    addNotification('Failed to load system usage data', 'error');
  }
}

// Fetch and render processes
async function fetchProcesses() {
  try {
    const res = await fetch(`http://127.0.0.1:5000/api/processes?sort=${sortBy}`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
    }
    processes = await res.json();
    renderProcessTable(processes);
  } catch (error) {
    console.error("Error fetching processes:", error);
    document.getElementById("processTable").innerHTML = `
      <tr>
        <td colspan="7" class="text-center p-6 text-red-500">
          <i class="fas fa-exclamation-circle mr-2"></i>${error.message || 'Failed to load process data'}
        </td>
      </tr>
    `;
  }
}

// Fetch system information
async function fetchSystemInfo() {
  try {
    const res = await fetch("http://127.0.0.1:5000/api/system_info");
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    
    // Update system info modal
    document.getElementById('siPlatform').textContent = `${data.system.platform} (${data.system.platform_version || 'N/A'})`;
    document.getElementById('siUptime').textContent = `${data.system.uptime} hours`;
    document.getElementById('siBootTime').textContent = data.system.boot_time;
    document.getElementById('siCpuModel').textContent = data.cpu.model;
    document.getElementById('siPhysicalCores').textContent = data.cpu.cores_physical;
    document.getElementById('siLogicalCores').textContent = data.cpu.cores_logical;
  } catch (error) {
    console.error("Error fetching system info:", error);
    document.getElementById('systemInfoContent').innerHTML = `
      <div class="bg-red-900/40 p-4 rounded-lg text-center">
        <i class="fas fa-exclamation-triangle mr-2"></i>
        Failed to load system information: ${error.message || 'Unknown error'}
      </div>
    `;
  }
}

// Render process table with filtering
function renderProcessTable(processes) {
  const table = document.getElementById("processTable");
  table.innerHTML = "";
  
  // Filter processes based on search term
  const filteredProcesses = processes.filter(proc => 
    proc.name.toLowerCase().includes(searchTerm) || 
    proc.pid.toString().includes(searchTerm)
  );
  
  document.getElementById("processCount").textContent = `${filteredProcesses.length} processes`;
  
  if (filteredProcesses.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="7" class="text-center p-6 text-gray-500">
          ${searchTerm ? 'No matching processes found' : 'No processes found'}
        </td>
      </tr>
    `;
    return;
  }
  
  filteredProcesses.forEach(proc => {
    const row = document.createElement("tr");
    row.className = "border-b border-gray-700 hover:bg-gray-700/50 transition-colors";
    row.innerHTML = `
      <td class="p-2">${proc.pid}</td>
      <td class="p-2 font-medium">
        ${proc.name}
        ${proc.cpu > 20 ? '<span class="ml-2 px-1.5 bg-red-500/20 text-red-300 rounded text-xs">High CPU</span>' : ''}
        ${proc.ram > 500 ? '<span class="ml-2 px-1.5 bg-blue-500/20 text-blue-300 rounded text-xs">High RAM</span>' : ''}
      </td>
      <td class="p-2 text-xs">
        <span class="px-2 py-1 rounded-full ${getStatusClass(proc.status)}">${proc.status}</span>
      </td>
      <td class="p-2 text-gray-300">${proc.user}</td>
      <td class="p-2">
        <div class="flex items-center">
          <div class="w-16 bg-gray-700 h-2 rounded-full mr-2">
            <div class="${getColorClass(proc.cpu, 'cpu')} h-2 rounded-full" style="width: ${Math.min(proc.cpu, 100)}%"></div>
          </div>
          ${proc.cpu.toFixed(1)}%
        </div>
      </td>
      <td class="p-2">
        <div class="flex items-center">
          <div class="w-16 bg-gray-700 h-2 rounded-full mr-2">
            <div class="${getColorClass(Math.min((proc.ram / 1000) * 100, 100), 'ram')} h-2 rounded-full" style="width: ${Math.min((proc.ram / 1000) * 100, 100)}%"></div>
          </div>
          ${proc.ram.toFixed(1)} MB
        </div>
      </td>
      <td class="p-2">
        <div class="tooltip">
          <button class="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs" data-pid="${proc.pid}">Terminate</button>
          <span class="tooltiptext">Terminate process ${proc.pid}</span>
        </div>
      </td>
    `;
    
    // Add event listener to terminate button
    const terminateBtn = row.querySelector('button');
    terminateBtn.addEventListener('click', (e) => {
      const pid = e.target.getAttribute('data-pid');
      terminateProcess(pid, row);
    });
    
    table.appendChild(row);
  });
}

// Terminate a process
async function terminateProcess(pid, row) {
  try {
    row.classList.add('flash');
    
    const res = await fetch(`http://127.0.0.1:5000/api/terminate/${pid}`, {
      method: 'POST'
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    
    if (data.success) {
      setTimeout(() => {
        row.style.opacity = '0.5';
        row.style.textDecoration = 'line-through';
        addNotification(`Process ${pid} terminated`, 'success');
        setTimeout(() => fetchProcesses(), 1000);
      }, 500);
    } else {
      addNotification(data.message, 'error');
    }
  } catch (error) {
    console.error("Error terminating process:", error);
    addNotification(error.message || 'Failed to terminate process', 'error');
  }
}

// Check for resource alerts
function checkResourceAlerts(data) {
  const newAlerts = [];
  
  if (data.cpu.percent > 90) {
    newAlerts.push({
      type: 'critical',
      message: `Critical CPU usage: ${data.cpu.percent.toFixed(1)}%`
    });
  } else if (data.cpu.percent > 80) {
    newAlerts.push({
      type: 'warning',
      message: `High CPU usage: ${data.cpu.percent.toFixed(1)}%`
    });
  }
  
  if (data.ram.percent > 90) {
    newAlerts.push({
      type: 'critical',
      message: `Critical RAM usage: ${data.ram.percent.toFixed(1)}%`
    });
  } else if (data.ram.percent > 80) {
    newAlerts.push({
      type: 'warning',
      message: `High RAM usage: ${data.ram.percent.toFixed(1)}%`
    });
  }
  
  if (data.disk.percent > 90) {
    newAlerts.push({
      type: 'critical',
      message: `Critical Disk usage: ${data.disk.percent.toFixed(1)}%`
    });
  } else if (data.disk.percent > 80) {
    newAlerts.push({
      type: 'warning',
      message: `High Disk usage: ${data.disk.percent.toFixed(1)}%`
    });
  }
  
  // Update alerts display
  const alertsContainer = document.getElementById('alertsContainer');
  if (newAlerts.length > 0) {
    alertsContainer.classList.remove('hidden');
    const alertsList = document.getElementById('alertsList');
    alertsList.innerHTML = '';
    
    newAlerts.forEach(alert => {
      const alertItem = document.createElement('li');
      alertItem.className = `flex items-center ${alert.type === 'critical' ? 'text-red-300' : 'text-yellow-300'}`;
      alertItem.innerHTML = `
        <i class="fas fa-${alert.type === 'critical' ? 'radiation' : 'exclamation-circle'} mr-2"></i>
        ${alert.message}
      `;
      alertsList.appendChild(alertItem);
    });
  } else {
    alertsContainer.classList.add('hidden');
  }
}

// Helper to add a temporary notification
function addNotification(message, type) {
  const container = document.createElement('div');
  container.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
    type === 'success' ? 'bg-green-800' : 'bg-red-800'
  } text-white opacity-0 transition-opacity duration-300`;
  container.style.zIndex = '1000';
  container.innerHTML = `
    <div class="flex items-center">
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} mr-2"></i>
      ${message}
    </div>
  `;
  
  document.body.appendChild(container);
  
  setTimeout(() => container.classList.replace('opacity-0', 'opacity-100'), 10);
  setTimeout(() => {
    container.classList.replace('opacity-100', 'opacity-0');
    setTimeout(() => document.body.removeChild(container), 300);
  }, 3000);
}

// Helper for getting color classes based on usage percentage
function getColorClass(percent, type) {
  if (percent >= 80) {
    return type === 'cpu' ? 'bg-gradient-to-r from-red-600 to-red-500' :
           type === 'ram' ? 'bg-gradient-to-r from-red-600 to-red-500' : 
           'bg-gradient-to-r from-red-600 to-red-500';
  } else if (percent >= 60) {
    return type === 'cpu' ? 'bg-gradient-to-r from-yellow-600 to-yellow-500' :
           type === 'ram' ? 'bg-gradient-to-r from-yellow-600 to-yellow-500' : 
           'bg-gradient-to-r from-yellow-600 to-yellow-500';
  } else {
    return type === 'cpu' ? 'bg-gradient-to-r from-green-600 to-green-500' :
           type === 'ram' ? 'bg-gradient-to-r from-blue-600 to-blue-500' : 
           'bg-gradient-to-r from-purple-600 to-purple-500';
  }
}

// Helper for process status classes
function getStatusClass(status) {
  switch(status.toLowerCase()) {
    case 'running': return 'bg-green-900/40 text-green-300';
    case 'sleeping': return 'bg-blue-900/40 text-blue-300';
    case 'stopped': return 'bg-red-900/40 text-red-300';
    case 'zombie': return 'bg-purple-900/40 text-purple-300';
    default: return 'bg-gray-900/40 text-gray-300';
  }
}

// Auto update
function updateAll() {
  fetchUsage();
  fetchProcesses();
}

// Initial fetch
updateAll();

// Set interval for updates
setInterval(updateAll, 5000);

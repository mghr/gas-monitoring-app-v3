// Load the Google Charts library
google.charts.load('current', {'packages':['gauge', 'corechart']});

// Wait for the Google Charts library to load
google.charts.setOnLoadCallback(initApp);

function initApp() {
  // User Data
  const users = {
    'admin': { password: 'password', role: 'Administrator' },
    'manager': { password: 'manager', role: 'Manager' },
    'user': { password: 'user', role: 'User' }
  };

  // Handle Login
  const loginForm = document.getElementById('login-form');
  const loginScreen = document.getElementById('login-screen');
  const appContent = document.getElementById('app-content');

  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim().toLowerCase();
    const password = document.getElementById('password').value.trim();

    if (users[username] && users[username].password === password) {
      loginScreen.style.display = 'none';
      appContent.style.display = 'block';
      const userRole = users[username].role;
      document.getElementById('user-role').innerText = userRole;

      // Store user role for later use
      sessionStorage.setItem('userRole', userRole);

      // Initialize the app after successful login
      initializeApp();
    } else {
      alert('Invalid credentials!');
    }
  });

  function initializeApp() {
    // Navigation Handling
    const navDashboard = document.getElementById('nav-dashboard');
    const navSettings = document.getElementById('nav-settings');
    const navLog = document.getElementById('nav-log');
    const navCctv = document.getElementById('nav-cctv');

    const sectionDashboard = document.getElementById('section-dashboard');
    const sectionSettings = document.getElementById('section-settings');
    const sectionLog = document.getElementById('section-log');
    const sectionCctv = document.getElementById('section-cctv');

    navDashboard.addEventListener('click', function(e) {
      e.preventDefault();
      showSection('dashboard');
    });

    navSettings.addEventListener('click', function(e) {
      e.preventDefault();
      showSection('settings');
    });

    navLog.addEventListener('click', function(e) {
      e.preventDefault();
      showSection('log');
    });

    navCctv.addEventListener('click', function(e) {
      e.preventDefault();
      showSection('cctv');
    });

    function showSection(section) {
      // Hide all sections
      sectionDashboard.style.display = 'none';
      sectionSettings.style.display = 'none';
      sectionLog.style.display = 'none';
      sectionCctv.style.display = 'none';

      // Remove 'active' class from all nav items
      navDashboard.classList.remove('active');
      navSettings.classList.remove('active');
      navLog.classList.remove('active');
      navCctv.classList.remove('active');

      // Show selected section and set active nav item
      if (section === 'dashboard') {
        sectionDashboard.style.display = 'block';
        navDashboard.classList.add('active');
      } else if (section === 'settings') {
        sectionSettings.style.display = 'block';
        navSettings.classList.add('active');
      } else if (section === 'log') {
        sectionLog.style.display = 'block';
        navLog.classList.add('active');
      } else if (section === 'cctv') {
        sectionCctv.style.display = 'block';
        navCctv.classList.add('active');
      }
    }

    // Show dashboard by default
    showSection('dashboard');

    // Generate Gas Channel Options in Settings
    generateGasChannelOptions();

    // Generate Gas Gauges
    generateGasGauges();

    // Initialize current values object
    currentValues = {};

    // Generate Initial Data for Historical Chart
    generateInitialHistoricalData();

    // Generate Sensor Status Table
    generateSensorStatusTable();

    // Initialize Historical Data Chart
    drawHistoricalChart();

    // Start updating data
    setInterval(updateData, 3000); // Update every 3 seconds
  }

  // Ask user for the number of channels
  const numberOfChannels = 16; // Change to 8 or 16 as needed

  // Generate Gas Channels Data
  const gasChannels = generateGasChannels(numberOfChannels);

  function generateGasChannels(count) {
    const channels = [];
    for (let i = 1; i <= count; i++) {
      channels.push({
        id: `gas${i}`,
        name: `Gas Sensor ${i}`,
        baseValue: 50 + i, // Different base values for variety
        minThreshold: 30 + i,
        maxThreshold: 70 + i,
        description: `This sensor monitors gas levels in zone ${i}.`,
        lastMaintenance: '2024-09-01',
        location: `Zone ${i}`
      });
    }
    return channels;
  }

  // Initialize current values object
  let currentValues = {};

  // Gauge Charts
  const gauges = {};

  // Historical Data
  let historicalData = [];

  // Event Log
  const eventLog = [];
  let eventIdCounter = 0;

  function generateGasChannelOptions() {
    const optionsContainer = document.getElementById('gas-channel-options');
    optionsContainer.innerHTML = '';
    gasChannels.forEach(channel => {
      const div = document.createElement('div');
      div.className = 'form-check';

      const checkbox = document.createElement('input');
      checkbox.className = 'gas-channel-checkbox';
      checkbox.type = 'checkbox';
      checkbox.id = `checkbox-${channel.id}`;
      checkbox.checked = true;

      const label = document.createElement('label');
      label.htmlFor = `checkbox-${channel.id}`;
      label.innerText = channel.name;

      div.appendChild(checkbox);
      div.appendChild(label);
      optionsContainer.appendChild(div);
    });

    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    darkModeToggle.addEventListener('change', function() {
      document.body.classList.toggle('dark-mode', darkModeToggle.checked);
    });

    // Save Settings
    const settingsForm = document.getElementById('settings-form');
    settingsForm.addEventListener('submit', function(e) {
      e.preventDefault();
      generateGasGauges();
      generateSensorStatusTable();
      alert('Settings saved!');
    });
  }

  function generateGasGauges() {
    const gasGaugesContainer = document.getElementById('gas-gauges');
    gasGaugesContainer.innerHTML = '';
    const selectedGases = getSelectedGasChannels();

    // Initialize historical data headers
    historicalData = [['Time', ...selectedGases.map(channel => channel.name)]];

    selectedGases.forEach(channel => {
      const gaugeDiv = document.createElement('div');
      gaugeDiv.className = 'gauge-container';
      gaugeDiv.id = `gauge-${channel.id}`;
      gasGaugesContainer.appendChild(gaugeDiv);

      // Initialize Gauge
      const data = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        [channel.name, 0]
      ]);

      const options = {
        width: 300,
        height: 300,
        redFrom: channel.maxThreshold,
        redTo: channel.maxThreshold + 10,
        yellowFrom: channel.maxThreshold - 5,
        yellowTo: channel.maxThreshold,
        minorTicks: 5,
        max: channel.maxThreshold + 10,
        min: channel.minThreshold - 10,
        greenFrom: channel.minThreshold,
        greenTo: channel.maxThreshold
      };

      const gauge = new google.visualization.Gauge(document.getElementById(`gauge-${channel.id}`));
      gauge.draw(data, options);

      gauges[channel.id] = { gauge: gauge, data: data, options: options };

      // Initialize current values
      currentValues[channel.id] = 0;
    });
  }

  function getSelectedGasChannels() {
    const selectedChannels = [];
    const checkboxes = document.querySelectorAll('.gas-channel-checkbox');
    checkboxes.forEach((checkbox, index) => {
      if (checkbox.checked) {
        selectedChannels.push(gasChannels[index]);
      }
    });
    return selectedChannels.length > 0 ? selectedChannels : gasChannels;
  }

  function generateInitialHistoricalData() {
    const dataPoints = 20; // Assume one data point every 3 seconds
    for (let i = dataPoints - 1; i >= 0; i--) {
      let time = new Date(Date.now() - i * 3000).toLocaleTimeString();
      const row = [time];
      gasChannels.forEach(channel => {
        let value = getRealisticValue(channel.baseValue, channel.minThreshold, channel.maxThreshold);
        row.push(value);
        currentValues[channel.id] = value;
      });
      historicalData.push(row);
    }
  }

  function updateData() {
    const time = new Date().toLocaleTimeString();
    const row = [time];
    const selectedGases = getSelectedGasChannels();

    selectedGases.forEach(channel => {
      const value = getRealisticValue(channel.baseValue, channel.minThreshold, channel.maxThreshold);
      row.push(value);
      currentValues[channel.id] = value;

      // Update Gauge
      const gaugeInfo = gauges[channel.id];
      if (gaugeInfo) {
        gaugeInfo.data.setValue(0, 1, value);
        gaugeInfo.gauge.draw(gaugeInfo.data, gaugeInfo.options);
      }

      // Update Alerts and Event Log
      updateStatus(channel, value);
    });

    // Update Historical Data
    historicalData.push(row);
    if (historicalData.length > 21) {
      historicalData.splice(1, 1); // Keep only last 20 data points
    }
    drawHistoricalChart();

    // Update Sensor Status Table
    generateSensorStatusTable();
  }

  function drawHistoricalChart() {
    const data = google.visualization.arrayToDataTable(historicalData);

    const options = {
      title: 'Historical Gas Data',
      curveType: 'function',
      legend: { position: 'bottom' },
      hAxis: { title: 'Time' },
      vAxis: { title: 'Gas Value' }
    };

    const chart = new google.visualization.LineChart(document.getElementById('historical-chart'));
    chart.draw(data, options);
  }

  function updateStatus(channel, value) {
    const minThreshold = channel.minThreshold;
    const maxThreshold = channel.maxThreshold;
    let status = 'Normal';
    let priority = 'Low';
    let shouldNotify = false;

    if (value < minThreshold || value > maxThreshold) {
      status = 'Critical';
      priority = 'High';
      shouldNotify = true;
    } else if (value < minThreshold + 5 || value > maxThreshold - 5) {
      status = 'Warning';
      priority = 'Medium';
    }

    if (status !== 'Normal') {
      addAlert(`${channel.name} - ${status} Alert! Value: ${value.toFixed(1)}`);
      addEventLog(channel.name, priority, 'System', `Value: ${value.toFixed(1)}`);
      if (shouldNotify) {
        sendNotification(`${channel.name} critical alert! Value: ${value.toFixed(1)}`);
      }
    }
  }

  function generateSensorStatusTable() {
    const tableBody = document.querySelector('#sensor-status-table tbody');
    tableBody.innerHTML = '';

    const selectedGases = getSelectedGasChannels();

    selectedGases.forEach(channel => {
      const row = document.createElement('tr');

      // Status indicator based on current value
      const value = currentValues[channel.id];
      let status = 'Normal';
      let color = '#2ecc71'; // Green

      if (value < channel.minThreshold || value > channel.maxThreshold) {
        status = 'Critical';
        color = '#e74c3c'; // Red
      } else if (value < channel.minThreshold + 5 || value > channel.maxThreshold - 5) {
        status = 'Warning';
        color = '#f1c40f'; // Yellow
      }

      row.innerHTML = `
        <td>${channel.id.toUpperCase()}</td>
        <td>${channel.name}</td>
        <td><span class="status-indicator" style="background-color: ${color};"></span> ${status}</td>
        <td>${value.toFixed(1)}</td>
        <td>${channel.minThreshold} - ${channel.maxThreshold}</td>
        <td><button class="details-button" data-channel-id="${channel.id}">View</button></td>
      `;

      tableBody.appendChild(row);
    });

    // Add event listeners for details buttons
    document.querySelectorAll('.details-button').forEach(button => {
      button.addEventListener('click', function() {
        const channelId = this.getAttribute('data-channel-id');
        showSensorDetails(channelId);
      });
    });
  }

  function showSensorDetails(channelId) {
    const channel = gasChannels.find(ch => ch.id === channelId);
    const modal = document.getElementById('sensor-modal');
    const closeButton = document.querySelector('.close-button');

    document.getElementById('sensor-modal-title').innerText = channel.name;
    document.getElementById('sensor-modal-content').innerHTML = `
      <p><strong>Current Value:</strong> ${currentValues[channel.id].toFixed(1)}</p>
      <p><strong>Normal Range:</strong> ${channel.minThreshold} - ${channel.maxThreshold}</p>
      <p><strong>Description:</strong> ${channel.description}</p>
      <p><strong>Last Maintenance:</strong> ${channel.lastMaintenance}</p>
      <p><strong>Location:</strong> ${channel.location}</p>
    `;

    modal.style.display = 'block';

    closeButton.onclick = function() {
      modal.style.display = 'none';
    };

    window.onclick = function(event) {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    };
  }

  // Alerts Management
  const alertsList = document.getElementById('alerts-list');

  function addAlert(message) {
    const alertItem = document.createElement('li');
    alertItem.innerText = `${new Date().toLocaleTimeString()} - ${message}`;
    alertsList.prepend(alertItem);

    // Limit number of alerts displayed
    if (alertsList.children.length > 5) {
      alertsList.removeChild(alertsList.lastChild);
    }
  }

  // Event Log Management
  function addEventLog(event, priority, owner, details) {
    const timestamp = new Date().toLocaleString();
    const id = ++eventIdCounter;
    eventLog.push({ id, timestamp, event, priority, owner, details });
    updateEventLogTable();
  }

  function updateEventLogTable() {
    const tableBody = document.getElementById('event-log-table').querySelector('tbody');
    tableBody.innerHTML = '';

    eventLog.slice().reverse().forEach(entry => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${entry.timestamp}</td>
        <td>${entry.event}</td>
        <td>${entry.priority}</td>
        <td>${entry.owner}</td>
        <td><button class="incident-button" data-incident-id="${entry.id}">View Report</button></td>
      `;
      tableBody.appendChild(row);
    });

    // Add event listener for incident buttons
    document.querySelectorAll('.incident-button').forEach(button => {
      button.addEventListener('click', function() {
        const incidentId = this.getAttribute('data-incident-id');
        showIncidentReport(incidentId);
      });
    });
  }

  function showIncidentReport(incidentId) {
    const incident = eventLog.find(e => e.id == incidentId);
    if (incident) {
      alert(`Incident Report for ${incident.event}:\n\nPriority: ${incident.priority}\nOwner: ${incident.owner}\nDetails: ${incident.details}\nTimestamp: ${incident.timestamp}`);
    }
  }

  // Simulate sending notifications
  function sendNotification(message) {
    console.log(`Notification sent: ${message}`);
    // Simulate sending an email
    alert(`Email sent to owner: ${message}`);
  }

  // Utility Function to Generate Realistic Values
  function getRealisticValue(base, min, max) {
    // Simulate gradual changes with occasional spikes
    let variation = Math.random() * 2 - 1; // -1 to 1
    let value = base + variation;

    // Increase chance of incident
    if (Math.random() < 0.5) { // 50% chance of variation
      value += (Math.random() * 5 - 2.5); // Slight variation
    }

    // Occasional spikes
    if (Math.random() < 0.02) { // 2% chance of spike
      value += (Math.random() * (max - base)) * (Math.random() < 0.5 ? -1 : 1);
    }

    // Keep value within reasonable bounds
    value = Math.max(min - 15, Math.min(max + 15, value));
    return parseFloat(value.toFixed(1));
  }
}

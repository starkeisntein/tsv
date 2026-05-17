const particleSystem = new ParticleSystem('particle-canvas');
let currentSettings = {};

function initSettings() {
  const countSlider = document.getElementById('particle-count');
  const countValue = document.getElementById('particle-count-value');
  const colorPicker = document.getElementById('particle-color');
  const speedSlider = document.getElementById('particle-speed');
  const speedValue = document.getElementById('particle-speed-value');

  countSlider.addEventListener('input', () => {
    const val = parseInt(countSlider.value);
    countValue.textContent = val;
    particleSystem.updateConfig({ count: val });
    saveCurrentSettings();
  });

  colorPicker.addEventListener('input', () => {
    particleSystem.updateConfig({ color: colorPicker.value });
    saveCurrentSettings();
  });

  speedSlider.addEventListener('input', () => {
    const val = parseFloat(speedSlider.value);
    speedValue.textContent = val.toFixed(1);
    particleSystem.updateConfig({ speed: val });
    saveCurrentSettings();
  });
}

function saveCurrentSettings() {
  const settings = {
    particleCount: parseInt(document.getElementById('particle-count').value),
    particleColor: document.getElementById('particle-color').value,
    particleSpeed: parseFloat(document.getElementById('particle-speed').value),
    backgroundImage: currentSettings.backgroundImage || '',
  };
  currentSettings = settings;
  if (window.electronAPI) {
    window.electronAPI.saveSettings(settings);
  }
}

function loadSettings(settings) {
  currentSettings = settings;

  if (settings.particleCount) {
    document.getElementById('particle-count').value = settings.particleCount;
    document.getElementById('particle-count-value').textContent = settings.particleCount;
    particleSystem.updateConfig({ count: settings.particleCount });
  }

  if (settings.particleColor) {
    document.getElementById('particle-color').value = settings.particleColor;
    particleSystem.updateConfig({ color: settings.particleColor });
  }

  if (settings.particleSpeed) {
    document.getElementById('particle-speed').value = settings.particleSpeed;
    document.getElementById('particle-speed-value').textContent = settings.particleSpeed.toFixed(1);
    particleSystem.updateConfig({ speed: settings.particleSpeed });
  }

  if (settings.backgroundImage) {
    setBackground(settings.backgroundImage);
  }
}

function setBackground(filePath) {
  const bgLayer = document.getElementById('background-layer');
  bgLayer.style.backgroundImage = `url('file:///${filePath.replace(/\\/g, '/')}')`;
}

document.getElementById('btn-select-bg').addEventListener('click', async () => {
  if (window.electronAPI) {
    await window.electronAPI.selectBackground();
  }
});

document.getElementById('settings-btn').addEventListener('click', () => {
  const panel = document.getElementById('settings-panel');
  panel.classList.toggle('hidden');
});

document.getElementById('settings-close').addEventListener('click', () => {
  document.getElementById('settings-panel').classList.add('hidden');
});

if (window.electronAPI) {
  window.electronAPI.onBackgroundChanged((filePath) => {
    setBackground(filePath);
    currentSettings.backgroundImage = filePath;
    saveCurrentSettings();
  });

  window.electronAPI.onSettingsLoaded((settings) => {
    loadSettings(settings);
  });
}

initSettings();

document.addEventListener('DOMContentLoaded', async () => {
  if (window.electronAPI) {
    const settings = await window.electronAPI.getSettings();
    if (settings) {
      loadSettings(settings);
    }
  }
});
const particleSystem = new ParticleSystem('particle-canvas');

function setBackground(filePath) {
  const bgLayer = document.getElementById('background-layer');
  bgLayer.style.backgroundImage = `url('file:///${filePath.replace(/\\/g, '/')}')`;
}

function applySettings(settings) {
  if (settings.particleCount !== undefined) {
    particleSystem.updateConfig({ count: settings.particleCount });
  }
  if (settings.particleColor !== undefined) {
    particleSystem.updateConfig({ color: settings.particleColor });
  }
  if (settings.particleSpeed !== undefined) {
    particleSystem.updateConfig({ speed: settings.particleSpeed });
  }
  if (settings.backgroundImage) {
    setBackground(settings.backgroundImage);
  }
}

if (window.electronAPI) {
  window.electronAPI.onBackgroundChanged((filePath) => {
    setBackground(filePath);
  });

  window.electronAPI.onSettingsLoaded((settings) => {
    applySettings(settings);
  });

  window.electronAPI.onSettingsUpdated((settings) => {
    applySettings(settings);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  if (window.electronAPI) {
    const settings = await window.electronAPI.getSettings();
    if (settings) {
      applySettings(settings);
    }
  }
});
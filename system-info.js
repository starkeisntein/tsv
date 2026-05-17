function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}天 ${hours}小时`;
  if (hours > 0) return `${hours}小时 ${mins}分钟`;
  return `${mins}分钟`;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getOSName(platform, release) {
  if (platform === 'win32') return `Windows ${release}`;
  if (platform === 'darwin') return `macOS ${release}`;
  if (platform === 'linux') return `Linux ${release}`;
  return `${platform} ${release}`;
}

async function updateSystemInfo() {
  try {
    const info = await window.electronAPI.getSystemInfo();

    let cpuLabel = info.cpuModel;
    if (cpuLabel.includes('Intel') || cpuLabel.includes('AMD')) {
      const parts = cpuLabel.split(' ');
      cpuLabel = parts.slice(0, 3).join(' ');
    }

    document.getElementById('sys-cpu').textContent = `${cpuLabel} (${info.cpuCores}核)`;
    document.getElementById('sys-mem').textContent = `${formatBytes(info.usedMem)} / ${formatBytes(info.totalMem)}`;
    document.getElementById('sys-os').textContent = getOSName(info.platform, info.release);
    document.getElementById('sys-uptime').textContent = formatUptime(info.uptime);

    const memPercent = parseFloat(info.memUsagePercent);
    const memBar = document.getElementById('sys-mem-bar');
    memBar.style.width = `${memPercent}%`;

    if (memPercent > 85) {
      memBar.style.background = 'linear-gradient(90deg, #f87171, #ef4444)';
    } else if (memPercent > 65) {
      memBar.style.background = 'linear-gradient(90deg, #fbbf24, #f59e0b)';
    } else {
      memBar.style.background = 'linear-gradient(90deg, #4ade80, #22d3ee)';
    }
  } catch (e) {
    console.warn('系统信息获取失败:', e);
  }
}

updateSystemInfo();
setInterval(updateSystemInfo, 3000);
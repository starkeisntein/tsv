class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouseX = -1000;
    this.mouseY = -1000;
    this.config = {
      count: 80,
      color: '#ffffff',
      speed: 1.0,
      size: 2,
      connectionDistance: 150,
    };

    this.resize();
    this.bindEvents();
    this.initParticles();
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());

    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    document.addEventListener('mouseleave', () => {
      this.mouseX = -1000;
      this.mouseY = -1000;
    });
  }

  updateConfig(config) {
    if (config.count !== undefined) {
      this.config.count = config.count;
      this.initParticles();
    }
    if (config.color !== undefined) {
      this.config.color = config.color;
    }
    if (config.speed !== undefined) {
      this.config.speed = config.speed;
    }
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.config.count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 2 * this.config.speed,
        vy: (Math.random() - 0.5) * 2 * this.config.speed,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.3,
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const speedMultiplier = this.config.speed;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      p.x += p.vx * speedMultiplier;
      p.y += p.vy * speedMultiplier;

      if (p.x < 0) p.x = this.canvas.width;
      if (p.x > this.canvas.width) p.x = 0;
      if (p.y < 0) p.y = this.canvas.height;
      if (p.y > this.canvas.height) p.y = 0;

      const dx = p.x - this.mouseX;
      const dy = p.y - this.mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120 * 0.05;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }

      const maxSpeed = 3 * speedMultiplier;
      const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (currentSpeed > maxSpeed) {
        p.vx = (p.vx / currentSpeed) * maxSpeed;
        p.vy = (p.vy / currentSpeed) * maxSpeed;
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = this.hexToRgba(this.config.color, p.opacity);
      this.ctx.fill();
    }

    this.drawConnections();
    requestAnimationFrame(() => this.animate());
  }

  drawConnections() {
    const maxDist = this.config.connectionDistance;
    const particles = this.particles;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          const opacity = (1 - dist / maxDist) * 0.3;
          this.ctx.beginPath();
          this.ctx.moveTo(particles[i].x, particles[i].y);
          this.ctx.lineTo(particles[j].x, particles[j].y);
          this.ctx.strokeStyle = this.hexToRgba(this.config.color, opacity);
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }

    const mouseDist = 180;
    for (let i = 0; i < particles.length; i++) {
      const dx = particles[i].x - this.mouseX;
      const dy = particles[i].y - this.mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < mouseDist) {
        const opacity = (1 - dist / mouseDist) * 0.5;
        this.ctx.beginPath();
        this.ctx.moveTo(particles[i].x, particles[i].y);
        this.ctx.lineTo(this.mouseX, this.mouseY);
        this.ctx.strokeStyle = this.hexToRgba(this.config.color, opacity);
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }
    }
  }

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
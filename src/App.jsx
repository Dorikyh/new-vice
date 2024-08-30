import { useEffect, useRef, useState } from 'react';
import './App.css';

export default function App() {
  const canvasRef = useRef(null);
  const [caromCount, setCaromCount] = useState(0);
  const [cuePower, setCuePower] = useState(10); // Initial cue power

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth * 0.9;
    canvas.height = canvas.width / 2;

    const balls = [
      { x: 100, y: 100, radius: 10, color: 'white', vx: 0, vy: 0 },
      { x: 200, y: 150, radius: 10, color: 'yellow', vx: 0, vy: 0 },
      { x: 300, y: 200, radius: 10, color: 'red', vx: 0, vy: 0 },
    ];

    let cue = { isShooting: false, power: cuePower, angle: 0 };
    let bandsTouched = new Set();
    let ballsHit = new Set();

    function isWhiteBallStationary() {
      return balls[0].vx === 0 && balls[0].vy === 0;
    }

    function areAllBallsStationary() {
      return balls.every(ball => ball.vx === 0 && ball.vy === 0);
    }

    canvas.addEventListener('mousedown', () => {
      if (areAllBallsStationary()) {
        cue.isShooting = true;
      }
    });

    canvas.addEventListener('mouseup', () => {
      if (cue.isShooting && areAllBallsStationary()) {
        cue.isShooting = false;

        balls[0].vx = Math.cos(cue.angle) * cue.power;
        balls[0].vy = Math.sin(cue.angle) * cue.power;

        cue.power = cuePower; // Reset power to initial value
      }
    });

    canvas.addEventListener('mousemove', (event) => {
      if (cue.isShooting && isWhiteBallStationary()) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const dx = mouseX - balls[0].x;
        const dy = mouseY - balls[0].y;
        cue.angle = Math.atan2(dy, dx);

        // Ensure cue power does not exceed maximum value
        cue.power = Math.min(Math.sqrt(dx * dx + dy * dy) * 0.1, cuePower); // Adjusted max power limit
      }
    });

    function detectCollision(ball1, ball2) {
      const dx = ball1.x - ball2.x;
      const dy = ball1.y - ball2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      return distance < ball1.radius + ball2.radius;
    }

    function handleCollision(ball1, ball2) {
      const dx = ball1.x - ball2.x;
      const dy = ball1.y - ball2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const nx = dx / distance;
      const ny = dy / distance;

      const tx = -ny;
      const ty = nx;

      const dpTan1 = ball1.vx * tx + ball1.vy * ty;
      const dpTan2 = ball2.vx * tx + ball2.vy * ty;

      const dpNorm1 = ball1.vx * nx + ball1.vy * ny;
      const dpNorm2 = ball2.vx * nx + ball2.vy * ny;

      const m1 = dpNorm2;
      const m2 = dpNorm1;

      ball1.vx = tx * dpTan1 + nx * m1;
      ball1.vy = ty * dpTan1 + ny * m1;
      ball2.vx = tx * dpTan2 + nx * m2;
      ball2.vy = ty * dpTan2 + ny * m2;

      const overlap = ball1.radius + ball2.radius - distance;
      const correction = overlap / 2;
      ball1.x += correction * nx;
      ball1.y += correction * ny;
      ball2.x -= correction * nx;
      ball2.y -= correction * ny;
    }

    function update() {
      bandsTouched.clear();
      ballsHit.clear();

      balls.forEach(ball => {
        ball.x += ball.vx;
        ball.y += ball.vy;

        ball.vx *= 0.99;
        ball.vy *= 0.99;

        if (Math.abs(ball.vx) < 0.01) ball.vx = 0;
        if (Math.abs(ball.vy) < 0.01) ball.vy = 0;

        if (ball.x + ball.radius > canvas.width) {
          ball.x = canvas.width - ball.radius;
          ball.vx = -ball.vx * 0.9;
          if (ball === balls[0]) bandsTouched.add('right');
        }
        if (ball.x - ball.radius < 0) {
          ball.x = ball.radius;
          ball.vx = -ball.vx * 0.9;
          if (ball === balls[0]) bandsTouched.add('left');
        }
        if (ball.y + ball.radius > canvas.height) {
          ball.y = canvas.height - ball.radius;
          ball.vy = -ball.vy * 0.9;
          if (ball === balls[0]) bandsTouched.add('bottom');
        }
        if (ball.y - ball.radius < 0) {
          ball.y = ball.radius;
          ball.vy = -ball.vy * 0.9;
          if (ball === balls[0]) bandsTouched.add('top');
        }
      });

      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          if (detectCollision(balls[i], balls[j])) {
            handleCollision(balls[i], balls[j]);
            if (balls[i] === balls[0] || balls[j] === balls[0]) {
              ballsHit.add(balls[i] === balls[0] ? balls[j] : balls[i]);
            }
          }
        }
      }

      if (balls[0].vx === 0 && balls[0].vy === 0 && bandsTouched.size >= 3 && ballsHit.size >= 1) {
        setCaromCount(prevCount => prevCount + 1);
        bandsTouched.clear();
        ballsHit.clear();
      }
    }

    function drawTable() {
      ctx.fillStyle = '#175f17';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawBall(ball) {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = ball.color;
      ctx.fill();
      ctx.closePath();
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawTable();

      balls.forEach(ball => drawBall(ball));

      if (cue.isShooting && isWhiteBallStationary()) {
        ctx.beginPath();
        ctx.moveTo(balls[0].x, balls[0].y);
        ctx.lineTo(
          balls[0].x + Math.cos(cue.angle) * cue.power * 10,
          balls[0].y + Math.sin(cue.angle) * cue.power * 10
        );
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = 'white';
      ctx.font = '24px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`Carambolas: ${caromCount}`, 10, 10);
    }

    function gameLoop() {
      update();
      draw();
      requestAnimationFrame(gameLoop);
    }

    gameLoop();
  }, [caromCount, cuePower]);

  return (
    <main>
      <h1>Billar Tres Bandas</h1>
      <canvas className='mesa' ref={canvasRef}></canvas>
      <div className="controls">
        <label htmlFor="power">Potencia del Tiro:</label>
        <input
          id="power"
          type="range"
          min="1"
          max="1000"
          value={cuePower}
          onChange={(e) => setCuePower(Number(e.target.value))}
        />
        <p>Potencia actual: {cuePower}</p>
      </div>
    </main>
  );
}

import { useEffect, useRef, useState } from 'react';
import './App.css';

export default function App() {
  const canvasRef = useRef(null);
  const [caromCount, setCaromCount] = useState(0);
  const [cuePower, setCuePower] = useState(20); // Initial cue power

  const MAX_WIDTH = 800; // Tamaño máximo en píxeles
  const MAX_HEIGHT = 400; // Tamaño máximo en píxeles

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Ajustar tamaño del canvas con límites máximos
    const canvasWidth = Math.min(window.innerWidth * 0.9, MAX_WIDTH);
    const canvasHeight = Math.min(canvasWidth / 2, MAX_HEIGHT);
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

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

    function handleStart(event) {
      if (areAllBallsStationary()) {
        cue.isShooting = true;
      }
    }

    function handleEnd(event) {
      if (cue.isShooting && areAllBallsStationary()) {
        cue.isShooting = false;

        // Invertir la dirección del disparo
        balls[0].vx = -Math.cos(cue.angle) * cue.power; // Inversión de la dirección
        balls[0].vy = -Math.sin(cue.angle) * cue.power; // Inversión de la dirección

        cue.power = cuePower; // Reiniciar la potencia al valor inicial
      }
    }

    function handleMove(event) {
      if (cue.isShooting && isWhiteBallStationary()) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const dx = mouseX - balls[0].x;
        const dy = mouseY - balls[0].y;
        cue.angle = Math.atan2(dy, dx);

        // Asegurarse de que la potencia del taco no exceda el valor máximo
        cue.power = Math.min(Math.sqrt(dx * dx + dy * dy) * 0.1, cuePower); // Límite máximo de potencia ajustado
      }
    }

    function handleTouchMove(event) {
      if (cue.isShooting && isWhiteBallStationary()) {
        event.preventDefault(); // Prevenir el comportamiento de scroll en dispositivos móviles
        const rect = canvas.getBoundingClientRect();
        const touch = event.touches[0];
        const mouseX = touch.clientX - rect.left;
        const mouseY = touch.clientY - rect.top;

        const dx = mouseX - balls[0].x;
        const dy = mouseY - balls[0].y;
        cue.angle = Math.atan2(dy, dx);

        // Asegurarse de que la potencia del taco no exceda el valor máximo
        cue.power = Math.min(Math.sqrt(dx * dx + dy * dy) * 0.1, cuePower);
      }
    }

    function handleTouchStart(event) {
      event.preventDefault(); // Prevenir el comportamiento de scroll en dispositivos móviles
      if (areAllBallsStationary()) {
        cue.isShooting = true;
      }
    }

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleEnd);

    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('touchstart', handleTouchStart);

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
      balls.forEach(ball => {
        ball.x += ball.vx;
        ball.y += ball.vy;

        ball.vx *= 0.99; // Freno
        ball.vy *= 0.99;

        if (Math.abs(ball.vx) < 0.01) ball.vx = 0;
        if (Math.abs(ball.vy) < 0.01) ball.vy = 0;

        // Detectar colisiones con bandas
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

      // Detectar colisiones entre bolas
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

      // Comprobar si la bola blanca se ha detenido completamente
      if (isWhiteBallStationary()) {
        if (bandsTouched.size >= 3 && ballsHit.size >= 1) {
          setCaromCount(prevCount => prevCount + 1);
        }
        // Reiniciar las listas de bandas tocadas y bolas golpeadas después de una carambola
        bandsTouched.clear();
        ballsHit.clear();
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dibujar bolas
      balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.closePath();
      });

      // Dibujar el palito de dirección
      if (cue.isShooting) {
        const arrowLength = 100;
        const arrowEndX = balls[0].x - Math.cos(cue.angle) * arrowLength; // Invertir dirección
        const arrowEndY = balls[0].y - Math.sin(cue.angle) * arrowLength; // Invertir dirección

        ctx.beginPath();
        ctx.moveTo(balls[0].x, balls[0].y);
        ctx.lineTo(arrowEndX, arrowEndY);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
      }

      requestAnimationFrame(update);
    }

    update();

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('touchstart', handleTouchStart);
    };
  }, [cuePower]);

  return (
    <div className="App">
      <canvas ref={canvasRef} style={{ border: '1px solid black' }}></canvas>
      <div>
        <label>
          Fuerza:
          <input
            type="range"
            min="10"
            max="50"
            value={cuePower}
            onChange={(e) => setCuePower(Number(e.target.value))}
          />
        </label>
      </div>
      <p>Caroms: {caromCount}</p>
    </div>
  );
}

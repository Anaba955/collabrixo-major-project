"use client";
import React, { useEffect, useRef } from 'react';

interface JeemBackgroundProps {
  opacity?: number;
  blurAmount?: number;
  speed?: number;
}

const JeemBackground: React.FC<JeemBackgroundProps> = ({ 
  opacity = 0.4, 
  blurAmount = 100,
  speed = 100
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions to match window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    // Call once on mount and add listener
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Gradient points
    const points = [
      { x: 0.1, y: 0.1, dx: 0.002, dy: 0.003, color: 'rgba(37, 99, 235, 1)' }, // Bright blue
      { x: 0.9, y: 0.2, dx: -0.002, dy: 0.002, color: 'rgba(59, 130, 246, 1)' }, // Medium blue
      { x: 0.5, y: 0.5, dx: 0.002, dy: 0.001, color: 'rgba(96, 165, 250, 1)' }, // Light blue
    ];
    
    // Animation loop
    let animationFrameId: number;
    
    const render = () => {
      if (!ctx || !canvas) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Move points
      points.forEach(point => {
        // Move point
        point.x += point.dx * (speed / 20);
        point.y += point.dy * (speed / 20);
        
        // Bounce off edges
        if (point.x <= 0 || point.x >= 1) point.dx *= -1;
        if (point.y <= 0 || point.y >= 1) point.dy *= -1;
      });
      
      // Create radial gradients at each point
      points.forEach(point => {
        const gradient = ctx.createRadialGradient(
          point.x * canvas.width, 
          point.y * canvas.height, 
          0, 
          point.x * canvas.width, 
          point.y * canvas.height, 
          canvas.width * 0.4
        );
        
        gradient.addColorStop(0, point.color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.globalCompositeOperation = 'lighten';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });
      
      // Continue animation loop
      animationFrameId = window.requestAnimationFrame(render);
    };
    
    // Start animation
    render();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [blurAmount, speed]);
  
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ 
          opacity, 
          filter: `blur(${blurAmount}px)` 
        }}
      />
    </div>
  );
};

export default JeemBackground; 
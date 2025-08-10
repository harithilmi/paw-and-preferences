// src/components/SwipeContainer.tsx
import React, { useState, useRef, useCallback, useEffect } from "react";
import { Cat } from "../types";

interface SwipeContainerProps {
  cats: Cat[];
  onSwipe: (direction: "left" | "right", cat: Cat) => void;
  onFinished: () => void;
}

interface SwipeCardProps {
  cat: Cat;
  onSwipe: (direction: "left" | "right", cat: Cat) => void;
  onCardLeftScreen: (catId: string) => void;
  isTop: boolean;
  index: number;
}

const SwipeCard = ({
  cat,
  onSwipe,
  onCardLeftScreen,
  isTop,
  index,
}: SwipeCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isTop) return;
      setIsDragging(true);
      setStartX(e.touches[0].clientX);
      setStartY(e.touches[0].clientY);
      setCurrentX(0);
      setCurrentY(0);
    },
    [isTop]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || !isTop) return;
      e.preventDefault();
      const deltaX = e.touches[0].clientX - startX;
      const deltaY = e.touches[0].clientY - startY;
      setCurrentX(deltaX);
      setCurrentY(deltaY);
    },
    [isDragging, isTop, startX, startY]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || !isTop) return;
    setIsDragging(false);

    const threshold = 100;
    const velocity = Math.abs(currentX) / 10;

    if (Math.abs(currentX) > threshold || velocity > 5) {
      const direction = currentX > 0 ? "right" : "left";
      onSwipe(direction, cat);
      onCardLeftScreen(cat.id);
    } else {
      // Reset position
      setCurrentX(0);
      setCurrentY(0);
    }
  }, [isDragging, isTop, currentX, onSwipe, cat, onCardLeftScreen]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isTop) return;
      setIsDragging(true);
      setStartX(e.clientX);
      setStartY(e.clientY);
      setCurrentX(0);
      setCurrentY(0);
    },
    [isTop]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !isTop) return;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      setCurrentX(deltaX);
      setCurrentY(deltaY);
    },
    [isDragging, isTop, startX, startY]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !isTop) return;
    setIsDragging(false);

    const threshold = 100;
    const velocity = Math.abs(currentX) / 10;

    if (Math.abs(currentX) > threshold || velocity > 5) {
      const direction = currentX > 0 ? "right" : "left";
      onSwipe(direction, cat);
      onCardLeftScreen(cat.id);
    } else {
      // Reset position
      setCurrentX(0);
      setCurrentY(0);
    }
  }, [isDragging, isTop, currentX, onSwipe, cat, onCardLeftScreen]);

  // Add/remove mouse event listeners
  useEffect(() => {
    if (isTop) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isTop, handleMouseMove, handleMouseUp]);

  const rotation = currentX * 0.1;
  const opacity = isTop ? 1 : 0.8;

  // Debug logging
  console.log(
    `Card ${
      cat.id
    }: isTop=${isTop}, index=${index}, opacity=${opacity}, zIndex=${
      isTop ? 10 : 9 - index
    }`
  );

  return (
    <div
      ref={cardRef}
      className={`absolute w-[90vw] h-[75vh] max-w-[400px] max-h-[600px] rounded-2xl bg-white shadow-xl flex flex-col justify-end p-4 cursor-grab overflow-hidden ${
        isDragging ? "cursor-grabbing" : ""
      }`}
      style={{
        transform: `translate(${currentX}px, ${currentY}px) rotate(${rotation}deg)`,
        opacity,
        transition: isDragging
          ? "none"
          : "transform 0.3s ease-out, opacity 0.3s ease-out",
        zIndex: isTop ? 10 : 9 - index,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
    >
      <img
        src={`https://cataas.com/cat/${cat.id}`}
        alt={`Cat ${cat.id}`}
        className="absolute inset-0 w-full h-full object-cover rounded-2xl"
        onError={(e) => {
          console.error("Failed to load image for cat:", cat.id);
          e.currentTarget.style.display = "none";
        }}
        onLoad={() => {
          console.log("Successfully loaded image for cat:", cat.id);
        }}
      />
      <div className="text-white text-center relative z-10">
        <h3 className="text-2xl font-bold drop-shadow-lg bg-black bg-opacity-30 p-2 rounded-lg mb-2">
          Swipe to decide!
        </h3>
        <p className="text-sm drop-shadow-lg bg-black bg-opacity-30 p-1 rounded">
          Cat ID: {cat.id}
        </p>
      </div>
    </div>
  );
};

const SwipeContainer = ({ cats, onSwipe, onFinished }: SwipeContainerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipe = (direction: "left" | "right", cat: Cat) => {
    onSwipe(direction, cat);
  };

  const handleCardLeftScreen = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev + 1;
      if (newIndex >= cats.length) {
        onFinished();
      }
      return newIndex;
    });
  };

  if (currentIndex >= cats.length) {
    return (
      <div className="relative w-[90vw] h-[75vh] max-w-[400px] max-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            No more cats!
          </h2>
          <p className="text-gray-500">You've seen all the cats.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-[90vw] h-[75vh] max-w-[400px] max-h-[600px]">
      {cats.slice(currentIndex, currentIndex + 3).map((cat, index) => (
        <SwipeCard
          key={cat.id}
          cat={cat}
          onSwipe={handleSwipe}
          onCardLeftScreen={handleCardLeftScreen}
          isTop={index === 0}
          index={index}
        />
      ))}
    </div>
  );
};

export default SwipeContainer;

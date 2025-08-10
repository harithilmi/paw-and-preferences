import { useState, useRef, useEffect } from "react";
import { Heart, X, RotateCcw, PawPrint } from "lucide-react";

interface Cat {
  id: number;
  imageUrl: string;
}

type SwipeDirection = "left" | "right" | null;

const PawsPreferences = () => {
  const [cats, setCats] = useState<Cat[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedCats, setLikedCats] = useState<Cat[]>([]);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>(null); // Track last swipe direction
  const [dragState, setDragState] = useState({
    isDragging: false,
    startX: 0,
    currentX: 0,
    startY: 0,
    currentY: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const cardRef = useRef(null);

  // Generate cat images from Cataas API
  useEffect(() => {
    const generateCats = () => {
      const catList = [];
      for (let i = 0; i < 15; i++) {
        catList.push({
          id: i,
          imageUrl: `https://cataas.com/cat?${i}&width=400&height=600`,
          // Add some variety with different parameters
          ...(i % 3 === 0 && {
            imageUrl: `https://cataas.com/cat/cute?${i}&width=400&height=600`,
          }),
          ...(i % 4 === 0 && {
            imageUrl: `https://cataas.com/cat/kitten?${i}&width=400&height=600`,
          }),
        });
      }
      setCats(catList);
      setIsLoading(false);
    };

    generateCats();
  }, []);

  const handleStart = (clientX: number, clientY: number) => {
    console.log("Drag started at:", { clientX, clientY });
    setDragState({
      isDragging: true,
      startX: clientX,
      currentX: clientX,
      startY: clientY,
      currentY: clientY,
    });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!dragState.isDragging) return;

    console.log("Moving:", {
      startX: dragState.startX,
      currentX: clientX,
      deltaX: clientX - dragState.startX,
    });

    setDragState((prev) => ({
      ...prev,
      currentX: clientX,
      currentY: clientY,
    }));
  };

  const handleEnd = (finalX?: number) => {
    console.log("handleEnd called, isDragging:", dragState.isDragging);
    if (!dragState.isDragging) return;

    // Use the final coordinates passed directly, or fall back to current state
    const deltaX = (finalX ?? dragState.currentX) - dragState.startX;
    const threshold = 60;

    console.log("Swipe ended:", {
      deltaX,
      threshold,
      willTrigger: Math.abs(deltaX) > threshold,
      startX: dragState.startX,
      finalX: finalX,
      stateCurrentX: dragState.currentX,
    });

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        // Right swipe = Like (matches right heart button)
        console.log("Right swipe - Like");
        setSwipeDirection("right");
        handleLike();
      } else {
        // Left swipe = Dislike (matches left X button)
        console.log("Left swipe - Dislike");
        setSwipeDirection("left");
        handleDislike();
      }
    } else {
      console.log("Swipe too short, no action taken");
    }

    // Reset drag state
    console.log("Resetting drag state");
    setDragState({
      isDragging: false,
      startX: 0,
      currentX: 0,
      startY: 0,
      currentY: 0,
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (dragState.isDragging) {
        handleMouseMove(e);
      }
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (dragState.isDragging) {
        handleEnd(e.clientX);
      }
    };

    if (dragState.isDragging) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [dragState.isDragging]);

  const handleLike = () => {
    console.log("Like action triggered");
    if (currentIndex < cats.length) {
      const currentCat = cats[currentIndex];
      setLikedCats((prev) => [...prev, currentCat]);
      // Don't set direction here for button clicks
      if (swipeDirection === null) {
        setSwipeDirection("right"); // Set direction for button clicks
      }
      advanceToNext();
    }
  };

  const handleDislike = () => {
    console.log("Dislike action triggered");
    if (currentIndex < cats.length) {
      // Don't set direction here for button clicks
      if (swipeDirection === null) {
        setSwipeDirection("left"); // Set direction for button clicks
      }
      advanceToNext();
    }
  };

  const advanceToNext = () => {
    console.log("Advancing to next card, current index:", currentIndex);
    if (currentIndex < cats.length - 1) {
      setCurrentIndex(currentIndex + 1);
      // Reset swipe direction after animation completes
      setTimeout(() => {
        setSwipeDirection(null);
      }, 600); // Match the exit animation duration
    } else {
      // Finished all cats, show results
      console.log("All cats completed, showing results");
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setLikedCats([]);
    setShowResults(false);
  };

  const getCardTransform = (index: number): string => {
    if (index < currentIndex) {
      // Cards that have been swiped away - animate in the direction they were swiped
      const direction = swipeDirection === "right" ? "100vw" : "-100vw";
      const rotation = swipeDirection === "right" ? "30deg" : "-30deg";
      return `translateX(${direction}) rotate(${rotation}) scale(0.8)`;
    }

    if (index === currentIndex && dragState.isDragging) {
      const deltaX = dragState.currentX - dragState.startX;
      const deltaY = (dragState.currentY - dragState.startY) * 0.1;
      const rotation = deltaX * 0.15; // Increased rotation for better feedback
      const scale = Math.max(0.9, 1 - Math.abs(deltaX) * 0.0005); // Slight scale change
      return `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg) scale(${scale})`;
    }

    if (index === currentIndex) {
      return "translate(0, 0) rotate(0deg) scale(1)";
    }

    const offset = index - currentIndex;
    return `translate(0, ${offset * 8}px) scale(${
      1 - offset * 0.04
    }) rotate(0deg)`;
  };

  const getOpacity = (index: number): number => {
    if (index < currentIndex) return 0;
    if (index === currentIndex) return 1;
    const offset = index - currentIndex;
    return Math.max(0, 1 - offset * 0.15);
  };

  useEffect(() => {
    if (showResults) {
      document.body.classList.remove('no-scroll');
    } else {
      document.body.classList.add('no-scroll');
    }
    
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [showResults]);

  const getLikeOpacity = () => {
    if (!dragState.isDragging) return 0;
    const deltaX = dragState.currentX - dragState.startX;
    // Right swipe shows LOVE overlay - reduced threshold for visual feedback
    return Math.max(0, Math.min(1, deltaX / 80));
  };

  const getDislikeOpacity = () => {
    if (!dragState.isDragging) return 0;
    const deltaX = dragState.currentX - dragState.startX;
    // Left swipe shows NOPE overlay - reduced threshold for visual feedback
    return Math.max(0, Math.min(1, -deltaX / 80));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100">
        <div className="animate-spin text-6xl mb-4">🐱</div>
        <h2 className="text-xl font-semibold text-gray-700">
          Loading adorable cats...
        </h2>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 p-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8 pt-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <PawPrint className="text-purple-600" size={32} />
              <h1 className="text-3xl font-bold text-gray-800">
                Your Results!
              </h1>
              <PawPrint className="text-purple-600" size={32} />
            </div>
            <p className="text-gray-600">
              You liked{" "}
              <span className="font-bold text-purple-600">
                {likedCats.length}
              </span>{" "}
              out of <span className="font-bold">{cats.length}</span> cats!
            </p>
          </div>

          {/* Liked cats grid */}
          {likedCats.length > 0 ? (
            <>
              <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
                Your Favorite Cats 😻
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {likedCats.map((cat, index) => (
                  <div key={cat.id} className="relative">
                    <img
                      src={cat.imageUrl}
                      alt={`Liked cat ${index + 1}`}
                      className="w-full h-48 object-cover rounded-xl shadow-lg"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full">
                      <Heart size={16} fill="white" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">😿</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                No cats caught your fancy?
              </h2>
              <p className="text-gray-600">
                That's okay, maybe try again with a fresh batch!
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <RotateCcw size={20} />
              Try Again
            </button>
          </div>

          {/* Fun stats */}
          <div className="mt-8 p-4 bg-white/50 rounded-2xl backdrop-blur-sm">
            <h3 className="font-semibold text-gray-700 mb-2 text-center">
              Fun Stats
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round((likedCats.length / cats.length) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Like Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-pink-600">
                  {cats.length - likedCats.length}
                </div>
                <div className="text-sm text-gray-600">Passed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100">
      {/* Header */}
      <div className="text-center py-6 px-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <PawPrint className="text-purple-600" size={28} />
          <h1 className="text-2xl font-bold text-gray-800">
            Paws & Preferences
          </h1>
          <PawPrint className="text-purple-600" size={28} />
        </div>
        <p className="text-gray-600 text-sm">
          Swipe right to love ❤️, left to pass ✋
        </p>
      </div>

      <div className="flex flex-col items-center justify-center px-4">
        <div className="relative w-full max-w-sm">
          <div className="relative h-96 mb-6">
            {/* Swipe container */}
            {cats.map((cat, index) => (
              <div
                key={cat.id}
                ref={index === currentIndex ? cardRef : null}
                className="absolute inset-0 bg-white rounded-2xl shadow-2xl cursor-grab active:cursor-grabbing overflow-hidden select-none"
                style={{
                  transform: getCardTransform(index),
                  opacity: getOpacity(index),
                  zIndex: cats.length - index,
                  transition: dragState.isDragging
                    ? "none"
                    : index < currentIndex
                    ? "all 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)" // Even slower exit animation
                    : "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                }}
                onMouseDown={
                  index === currentIndex ? handleMouseDown : undefined
                }
                onTouchStart={
                  index === currentIndex ? handleTouchStart : undefined
                }
                onTouchMove={
                  index === currentIndex ? handleTouchMove : undefined
                }
                onTouchEnd={index === currentIndex ? handleTouchEnd : undefined}
              >
                <div className="relative h-full">
                  <img
                    src={cat.imageUrl}
                    alt={`Cat ${cat.id + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                    loading={index === currentIndex ? "eager" : "lazy"}
                  />

                  {/* Love overlay */}
                  <div
                    className="absolute top-8 right-8 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-lg border-4 border-red-400 rotate-12 flex items-center gap-1"
                    style={{
                      opacity: getLikeOpacity(),
                      transform: `rotate(12deg) scale(${
                        1 + getLikeOpacity() * 0.3
                      })`,
                    }}
                  >
                    <Heart size={16} fill="white" />
                    LOVE
                  </div>

                  {/* Nope overlay */}
                  <div
                    className="absolute top-8 left-8 bg-gray-600 text-white px-4 py-2 rounded-full font-bold text-lg border-4 border-gray-400 -rotate-12"
                    style={{
                      opacity: getDislikeOpacity(),
                      transform: `rotate(-12deg) scale(${
                        1 + getDislikeOpacity() * 0.3
                      })`,
                    }}
                  >
                    NOPE
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex justify-center gap-8 mb-6">
            <button
              onClick={handleDislike}
              className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-200 hover:scale-110 group"
            >
              <X
                size={28}
                className="text-gray-600 group-hover:scale-110 transition-transform"
              />
            </button>

            <button
              onClick={handleLike}
              className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-200 hover:scale-110 group"
            >
              <Heart
                size={28}
                className="text-red-500 group-hover:scale-110 transition-transform"
              />
            </button>
          </div>

          {/* Progress indicator */}
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">
              {currentIndex + 1} of {cats.length}
            </p>
            <div className="w-full bg-white/50 rounded-full h-2 backdrop-blur-sm">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentIndex + 1) / cats.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PawsPreferences;

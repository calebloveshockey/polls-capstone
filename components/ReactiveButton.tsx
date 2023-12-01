"use client"

import { CheckCircle } from "@mui/icons-material";
import { Box, Button, CircularProgress } from "@mui/material";
import { useEffect, useRef, useState } from "react";

interface ReactiveButtonProps {
    text: string;
    isSuccess: boolean;
    isProcessing: boolean;
    onClick: () => void;
}

export default function ReactiveButton({text, isSuccess, isProcessing, onClick}: ReactiveButtonProps) {

    // Dynamically determine fontSize
    const [fontSize, setFontSize] = useState(20);
    const textRef = useRef<HTMLSpanElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    
    useEffect(() => {
        const adjustFontSize = () => {
            if (textRef.current && buttonRef.current) {
                const availableWidth = buttonRef.current.offsetWidth;
                const availableHeight = buttonRef.current.offsetHeight;

                if ((textRef.current.offsetWidth > availableWidth || textRef.current.offsetHeight > availableHeight)&& fontSize > 5) {
                    setFontSize(fontSize - 1);
                }
            }
        };

        adjustFontSize();

        // Adjust font size on window resize
        window.addEventListener('resize', adjustFontSize);
        return () => window.removeEventListener('resize', adjustFontSize);
    }, [text, fontSize]);


  return (
    <Button 
        ref={buttonRef}
        sx={{
            fontSize: `${fontSize}px`,
            padding: '5px',
            width: '130px',
            height: '50px',
            backgroundColor: isSuccess ? 'green' : "",

        }}
        onClick={onClick} 
        variant="contained" 
        disabled={isProcessing}
    >

        {isProcessing ? (
            <CircularProgress size={24} />
        ) : isSuccess ? (
            <CheckCircle 
                fontSize='large'
            />
        ) : (
            <span ref={textRef}>{text}</span>
        )}

  </Button>
  );
}

export { ReactiveButton};

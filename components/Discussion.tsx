"use client"

interface DiscussionProps {
    shareCode: string;
}

export default function Discussion({ shareCode }: DiscussionProps){

    return(
        <div>Discussion Here</div>
    );
}

export {Discussion};
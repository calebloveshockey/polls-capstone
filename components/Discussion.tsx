"use client"

import { addComment, getComments } from "@/actions/actions";
import { Box, Button, TextField } from "@mui/material";
import { useEffect, useState } from "react";

interface DiscussionProps {
    shareCode: string;
}

interface Comment {
    comment_id: number,
    date: string,
    comment_text: string,
    username: string,
    parent_comment: number
}

export default function Discussion({ shareCode }: DiscussionProps){

    // Hides/shows entire discussion section
    const [showComments, setShowComments] = useState<boolean>(false);
    // Hides/shows comment box or info message 
    const [showWriteComment, setShowWriteComment] = useState<boolean>(false);

    // Array of all comments on this poll
    const [comments, setComments] = useState<Comment[]>([]);

    // Controls refreshing of the comment section
    const [reloadData, setReloadData] = useState(0);

    // Error handling
    const [isError, setIsError] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");

    // Retrieve comments
    useEffect( () => {
        const fetchData = async () => {
            setIsError(false);
            setErrorMessage("");

            try {
                // GET DATA
                const data = await getComments(shareCode);

                // PROCESS DATA
                if(data.status === "SUCCESS"){
                    setComments(data.comments);
                    setShowComments(true);
                    setShowWriteComment(true);

                }else if(data.status === "NOUSER"){
                    setComments(data.comments);
                    setShowComments(true);

                }else{
                    setIsError(true);
                    setErrorMessage("Unable to retrieve discussion data");
                    setShowComments(false);
                    setShowWriteComment(false);
                }

            } catch (error) {
                console.error('Error retrieving votes:', error);
                setIsError(true);
                setErrorMessage("Unknown error occurred trying to retrieve discussion data.");
                setShowComments(false);
                setShowWriteComment(false);
            }
        };
        
        fetchData();
    }, [shareCode, reloadData]);

    const [commentBoxLabel, setCommentBoxLabel] = useState("Write your comment here...");
    const [replyingCommentId, setReplyingCommentId] = useState(null);
    const [newComment, setNewComment] = useState("");

    const publishComment = async () => {
        console.log("Publishing comment");

        const res = await addComment(shareCode, newComment, replyingCommentId);

        if(res.status === "SUCCESS"){
            console.log("Published comment successfully!");
            setNewComment("");
            setReplyingCommentId(null);
            // refresh comments
            setReloadData(prevReloadData => prevReloadData + 1);
        }else{
            console.log("Something went wrong publishing comment.");
            console.log(res);
        }
    }

    function formatDate(inputDate: string): string {
        const now = new Date();
        const utcDate = new Date(inputDate);
        // Adjusting for the 5-hour difference
        utcDate.setHours(utcDate.getHours() - 5);

        if (isNaN(utcDate.getTime())) {
            console.log("invalid date");
            return 'Invalid Date: ' + inputDate;
        }
      
        // Calculate the time difference in milliseconds
        const timeDifference = now.getTime() - utcDate.getTime();
      
        // Convert milliseconds to minutes
        const minutesAgo = Math.ceil(timeDifference / (1000 * 60));
      
        if (minutesAgo < 60) {
          return `${minutesAgo} ${minutesAgo === 1 ? 'min' : 'mins'} ago`;
        } else if (minutesAgo < 24 * 60) {
          const hoursAgo = Math.floor(minutesAgo / 60);
          return `${hoursAgo} ${hoursAgo === 1 ? 'hour' : 'hours'} ago`;
        } else {
          // Format the date as "Month Day, Year"
          const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          };
          return utcDate.toLocaleDateString('en-US', options);
        }
    }

    // Helper function to determine a "random" color for the user's comment bubble
    // Will always return the same color for the same string
    // Returns number from 1 to 10
    function customHash(str: string) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = (hash << 5) - hash + char;
        }
        // Ensure the result is positive and within the range [1, 10]
        return ((hash & 0x7FFFFFFF) % 10) + 1;
    }


    return(

        <Box sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: 'center',
        }}>

        {showComments &&
            <>
            <Box sx={{
                margin: "20px",
                fontSize: "24px",
                fontWeight: "bold",
            }}>Discussion</Box>


            {(comments.length === 0) ?

                <Box sx={{
                    fontSize: "18px",
                    marginBottom: "5px",
                }}>No one has commented on this poll yet. Be the first!</Box>

            :   <>
                {comments.map((comment) => (
                    <Box 
                        key={comment.comment_id}
                        sx={{
                            width: '100%',
                            display: 'grid',
                            gridTemplateColumns: '60px auto',
                            gridTemplateRows: 'auto auto',
                            marginBottom: '20px',
                        }}
                    >
                        <Box
                            sx={{
                                backgroundColor: 'rgb(var(--comment-color-'+ customHash(comment.username) +'))',
                                width: '40px',
                                height: '40px',
                                borderRadius: '40px',
                                gridColumn: '1/2',
                                gridRow: '1/3',
                            }}
                        ></Box>

                        <Box
                            sx={{
                                width: '100%',
                                gridColumn: '2/3',
                                gridRow: '1/2',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'flex-end',
                                marginBottom: '5px',
                            }}
                        >
                            <Box sx={{
                                fontWeight: 'bold',
                                fontSize: '18px',
                                marginRight: '30px',
                            }}
                            >{comment.username}</Box>
                            <Box sx={{
                                fontSize: '14px',
                                color: 'gray',
                            }}
                            >{formatDate(comment.date)}</Box>
                        </Box>

                        <Box
                            sx={{
                                width: '100%',
                                gridColumn: '2/3',
                                gridRow: '2/3',
                            }}
                        >{comment.comment_text}</Box>

                    </Box>
                ))}
                </>
            }

            {showWriteComment ? 
                <>
                    <Box sx={{
                        border: '1px solid black',
                        width: '100%',
                        marginTop: '10px',
                    }}>
                        <TextField
                            sx={{
                                width: '100%',
                                fontSize: '18px',
                            }}
                            id="filled-multiline-static"
                            label={commentBoxLabel}
                            multiline
                            rows={3}
                            value={newComment}
                            onChange={(event) => setNewComment(event.target.value) }
                            variant="filled"
                        />
                    </Box>
                    <Button
                        sx={{
                            marginTop: "20px",
                            fontSize: "18px",
                            minWidth: "200px",
                            width: "30%",
                        }}
                        onClick={publishComment}
                        variant="contained"
                    >COMMENT</Button>

                </>

            :   
                <Box sx={{
                    textAlign: "center",
                    fontSize: "18px",
                }}>Login to join the discussion!</Box> 
            }
            </>
        }

        {isError &&
        <Box sx={{
            fontWeight: "bold",
            color: 'red',
            marginTop: '10px',
        }}>{errorMessage}</Box>}
            
        </Box>
    );
}

export {Discussion};
"use client"

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { Box } from '@mui/material';
import { getPollType} from '@/actions/actions';
import TradVoter from './TradVoter';
import RankedVoter from './RankedVoter';
import ApprovalVoter from './ApprovalVoter';

interface PollVoterProps {
    shareCode: string;
}

export default function PollVoter({ shareCode }: PollVoterProps) {
    const [pollType, setPollType] = useState("");
    const [pollName, setPollName] = useState("");

    // Retrieve poll type
    useEffect( () => {
        const fetchData = async () => {
            try {
                // GET DATA
                const data = await getPollType(shareCode);

                if(data.status === "SUCCESS"){
                    setPollType(data.pollType);
                    setPollName(data.pollName);
                }else{
                    console.error("Error on server retrieving poll type.")
                }

            } catch (error) {
                console.error('Error retrieving poll type:', error);
            }
        };
        
        fetchData();
    }, []);


    return (
        <>
            {pollType === "Traditional" &&  <TradVoter shareCode={shareCode}/> }
            {pollType === "Ranked" && <RankedVoter shareCode={shareCode}/>}
            {pollType === "Approval" && <ApprovalVoter shareCode={shareCode}/>}
        </>
    );
}

export { PollVoter };

import { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import { saveUserSession } from '../services/sessionService';
import LogTimeWebApi from '../repositories/logTimeWebApi';
import { LogFile, SessionData } from '../types';

function useSessionTimer(logTimeWebApi: LogTimeWebApi, userSessionRef: React.MutableRefObject<SessionData>,
    updateServerLastContact: (newServerLastContact: string) => void, handleError: (e: unknown, logFile: LogFile) => void) {

    const [sessionTime, setSessionTime] = useState(userSessionRef.current?.sessionTime);
    const [activityTime, setActivityTime] = useState(userSessionRef.current?.activityTime);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const formatTime = (seconds: number): string => moment.utc(moment.duration(seconds, 'seconds').asMilliseconds()).format('HH:mm:ss');


    useEffect(() => {

        const logFile: LogFile = {
            userId: userSessionRef.current.user?.id,
            roleId: userSessionRef.current.user?.roleId,
            component: "Home - useSessionTimer hook"
        }

        const updateSession = async () => {

            try {
                userSessionRef.current.sessionTotalSecs += 1;
                userSessionRef.current.activityTotalSecs += 1;

                userSessionRef.current.sessionTime = formatTime(userSessionRef.current.sessionTotalSecs);
                userSessionRef.current.activityTime = formatTime(userSessionRef.current.activityTotalSecs);

                setSessionTime(userSessionRef.current.sessionTime);
                setActivityTime(userSessionRef.current.activityTime);



                if (userSessionRef.current.sessionTotalSecs % 60 === 0) {
                    const response = await logTimeWebApi.updateSessionAliveDateAsync(userSessionRef.current.historyLogId);
                    userSessionRef.current.serverLastContact = moment(response.lastDate).format("YYYY-MM-DD HH:mm:ss");
                    updateServerLastContact(userSessionRef.current.serverLastContact);
                }

                saveUserSession(userSessionRef.current);
            } catch (e) {
                handleError(e, logFile);
            }
        }

        intervalRef.current = setInterval(updateSession, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };

    }, [logTimeWebApi, userSessionRef, sessionTime, activityTime, updateServerLastContact, handleError]);

    return { sessionTime, activityTime };
}

export default useSessionTimer;

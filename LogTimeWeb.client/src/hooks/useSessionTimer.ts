import { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import LogTimeWebApi from '../repositories/logTimeWebApi';
import { LogFile, MESSAGE, SessionData } from '../types';
import { useDialogs } from '@toolpad/core';
import useSessionManager from './useSessionManager';

function useSessionTimer(logTimeWebApi: LogTimeWebApi, userSessionRef: React.MutableRefObject<SessionData>,
    updateServerLastContact: (newServerLastContact: string) => void) {
    const sessionManager = useSessionManager();
    const [sessionTime, setSessionTime] = useState(userSessionRef.current?.sessionTime);
    const [activityTime, setActivityTime] = useState(userSessionRef.current?.activityTime);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const dialogs = useDialogs();

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

                    if (response.isSessionAlreadyClose) {
                        logFile.message = MESSAGE.SESSION_CLOSED;
                        await logTimeWebApi.writeLogToFileAsync(logFile);
                        await dialogs.alert(MESSAGE.SESSION_CLOSED, { title: "" });
                        sessionManager.logOut();
                        return;
                    }

                    if (!response.hasError) {
                        userSessionRef.current.serverLastContact = moment(response.lastDate).format("YYYY-MM-DD HH:mm:ss");
                        updateServerLastContact(userSessionRef.current.serverLastContact);
                    } else {
                        logFile.message = response.message;
                        sessionManager.handleError(new Error(response.message), logFile);
                    }
                   
                }

                sessionManager.saveUserSession(userSessionRef.current);
            } catch (e) {
                sessionManager.handleError(e, logFile);
            }
        }

        intervalRef.current = setInterval(updateSession, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };

    }, [logTimeWebApi, userSessionRef, sessionTime, activityTime, updateServerLastContact, sessionManager, dialogs]);

    return { sessionTime, activityTime };
}

export default useSessionTimer;

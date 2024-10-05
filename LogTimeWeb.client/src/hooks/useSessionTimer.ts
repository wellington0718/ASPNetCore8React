import { useState, useEffect, useRef } from 'react';
import moment from 'moment';
import { saveUserSession } from '../services/sessionService';
import LogTimeWebApi from '../repositories/logTimeWebApi';
import { UserSession } from '../types';

function useSessionTimer(logTimeWebApi: LogTimeWebApi, userSessionRef: React.MutableRefObject<UserSession | null>,
    updateServerLastContact: (newServerLastContact: string) => void) {


    const [sessionTime, setSessionTime] = useState(userSessionRef.current?.sessionTime);
    const [activityTime, setActivityTime] = useState(userSessionRef.current?.activityTime);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const formatTime = (seconds: number): string => moment.utc(moment.duration(seconds, 'seconds')
        .asMilliseconds()).format('HH:mm:ss');

    useEffect(() => {
        const updateSession = async () => {
            const userSessionCurrent = userSessionRef.current;

            if (userSessionCurrent != null) {
                userSessionCurrent.sessionTotalSecs += 1;
                userSessionCurrent.activityTotalSecs += 1;

                userSessionCurrent.sessionTime = formatTime(userSessionCurrent.sessionTotalSecs);
                userSessionCurrent.activityTime = formatTime(userSessionCurrent.activityTotalSecs);

                setSessionTime(userSessionCurrent.sessionTime);
                setActivityTime(userSessionCurrent.activityTime);

                try {
                    if (userSessionCurrent.sessionTotalSecs % 60 === 0) {
                        const response = await logTimeWebApi.updateSessionAliveDate(userSessionCurrent.historyLogId);
                        userSessionCurrent.serverLastContact = moment(response.lastDate).format("YYYY-MM-DD HH:mm:ss");
                        updateServerLastContact(userSessionCurrent.serverLastContact);
                    }
                } catch (e) {
                    console.log(e);
                }

                saveUserSession(userSessionCurrent);
            }
        };

        intervalRef.current = setInterval(updateSession, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };

    }, [logTimeWebApi, userSessionRef, sessionTime, activityTime, updateServerLastContact]);

    return { sessionTime, activityTime };
}

export default useSessionTimer;

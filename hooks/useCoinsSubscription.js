import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const useCoinsSubscription = (uid) => {
    const [coinCount, setCoinCount] = useState(0);

    useEffect(() => {
        let mounted = true;
        let channel;
        
        const setupCoinSubscription = async (userUid) => {
            if (!userUid) {
                console.log("No UID available to fetch coins");
                return;
            }

            try {
                // Initial fetch
                const { data, error } = await supabase
                    .from('users')
                    .select('user_coins')
                    .eq('uid', userUid)
                    .single();

                if (error) throw error;

                if (data && mounted) {
                    console.log(`Initial coins fetched for ${userUid}:`, data.user_coins);
                    setCoinCount(data.user_coins);
                }

                // Create a unique channel name for this subscription
                const channelName = `coins-${userUid}-${Math.random()}`;
                console.log(`Setting up channel: ${channelName}`);

                // Set up real-time subscription
                channel = supabase.channel(channelName);

                channel
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'users',
                            filter: `uid=eq.${userUid}`,
                        },
                        (payload) => {
                            console.log(`Received update for ${userUid}:`, payload);
                            if (mounted && payload.new?.user_coins !== undefined) {
                                console.log(`Setting new coin count: ${payload.new.user_coins}`);
                                setCoinCount(payload.new.user_coins);
                            }
                        }
                    )
                    .subscribe((status) => {
                       
                    });

                return channel;
            } catch (error) {
                console.error(`Error in coin subscription for ${userUid}:`, error);
            }
        };

        if (uid) {
            console.log(`Initializing subscription for UID: ${uid}`);
            setupCoinSubscription(uid);
        }

        return () => {
            mounted = false;
            if (channel) {
                console.log(`Cleaning up subscription for UID: ${uid}`);
                channel.unsubscribe();
                supabase.removeChannel(channel);
            }
        };
    }, [uid]);

    return coinCount;
}; 
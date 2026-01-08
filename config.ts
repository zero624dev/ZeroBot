export const environment = process.env.NODE_ENV;
export const timezone = process.env.TZ;

export const db = {
    host: '',
    port: 27017,
    name: '',
    user: '',
    password: '',
    minPoolSize: 5,
    maxPoolSize: 20
};

export const prefix = '0';
export const logChannelId = '1146865229955874967';
export const supportGuildId = '678566031874064394';

export const tokens = Object.freeze({
    discord: '',
    osu: '',
    neis: '',
    googleapis: '',
    deepl: '',
    koreanbots: ''
});

export const colors = {
    accent: 0x00007FFF,
    error: 0xEE2C2C,
    warn: 0xFFCC00
};
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export const getDeviceFingerprint = async () => {
    const fp = await FingerprintJS.load();

    const result = await fp.get();
    console.log(result);
    //debugger;
    return result.visitorId;
};
// Embed valid fingerprints in the code
const FINGERPRINTSET = [
    '8F:C1:46:FB:19:0A:16:FF:F7:D1:E6:48:5C:74:54:0E:00:FF:36:A6'
];

class ApiRequest {

    static execute(request) {
        return request.on('socket', socket => {
            socket.on('secureConnect', () => {
                var fingerprint = socket.getPeerCertificate().fingerprint;

                // Match the fingerprint with our saved fingerprints
                if (!FINGERPRINTSET.includes(fingerprint)) {
                    // Abort request, optionally emit an error event
                    console.log('Fingerprint does not match')
                    request.send('error', new Error('Fingerprint does not match'));
                    return request.abort();
                }
            });
        });
    }
}

module.exports = ApiRequest;
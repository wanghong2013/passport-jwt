var Strategy = require('../lib/strategy')
    , chai = require('chai')
    , test_data = require('./testdata')
    , sinon = require('sinon');

describe('Strategy', function() {

    describe('calling JWT validation function', function() {
        var strategy; 

        before(function(done) {
            verifyStub = sinon.stub();
            verifyStub.callsArgWith(1, null, {}, {});
            options = {};
            options.issuer = "TestIssuer";
            options.audience = "TestAudience";
            strategy = new Strategy('secret', options, verifyStub);

            Strategy.JwtVerifier = sinon.stub();
            Strategy.JwtVerifier.callsArgWith(3, null, test_data.valid_jwt.payload);

            chai.passport.use(strategy)
                .success(function(u, i) {
                    done();
                })
                .req(function(req) {
                    req.headers['x-auth_token'] = test_data.valid_jwt.token;
                })
                .authenticate();
        });


        it('should call with the right secret as an argument', function() {
            expect(Strategy.JwtVerifier.args[0][1]).to.equal('secret');
        });


        it('should call with the right issuer option', function() {
            expect(Strategy.JwtVerifier.args[0][2]).to.be.an.object;
            expect(Strategy.JwtVerifier.args[0][2].issuer).to.equal('TestIssuer');
        });


        it('should call with the right audience option', function() {
            expect(Strategy.JwtVerifier.args[0][2]).to.be.an.object;
            expect(Strategy.JwtVerifier.args[0][2].audience).to.equal('TestAudience');
        });


    });


    describe('handling valid jwt', function() {
        var strategy, payload;

        before(function(done) {
            strategy = new Strategy('secret', function(jwt_payload, next) { 
                payload = jwt_payload;
                next(null, {}, {});
            });

            // Mock successful verification
            Strategy.JwtVerifier = sinon.stub();
            Strategy.JwtVerifier.callsArgWith(3, null, test_data.valid_jwt.payload);

            chai.passport.use(strategy)
                .success(function(u, i) {
                    done();
                })
                .req(function(req) {
                    req.headers['x-auth_token'] = test_data.valid_jwt.token;
                })
                .authenticate();
        });


        it('should call verify with the correct payload', function() {
            expect(payload).to.deep.equal(test_data.valid_jwt.payload);
        });


    });


    describe('handling failing jwt', function() {
        var strategy, info; 
        var verify_spy = sinon.spy();

        before(function(done) {

            strategy = new Strategy('secret', verify_spy);

            // Mock errored verification
            Strategy.JwtVerifier = sinon.stub();
            Strategy.JwtVerifier.callsArgWith(3, new Error("jwt expired"), false);

            chai.passport.use(strategy)
                .fail(function(i) {
                    info = i;
                    done();
                })
                .req(function(req) {
                    req.headers['x-auth_token'] = test_data.valid_jwt.token;
                })
                .authenticate();
        });


        it('should not call verify', function() {
            sinon.assert.notCalled(verify_spy);
        });


        it('should fail with error message.', function() {
            expect(info).to.be.an.object;
            expect(info.message).to.equal('jwt expired');
        });

    });

});
 

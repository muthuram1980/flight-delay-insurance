const { constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const FlightSuretyApp = artifacts.require('FlightSuretyApp');
const FlightSuretyData = artifacts.require('FlightSuretyData');

const STATUS_CODE_ON_TIME = 1;
const STATUS_CODE_LATE_AIRLINE = 2;
function fromEther(value) {
  return web3.utils.toWei(value,"ether");
}

function toEther(value) {
  return web3.utils.fromWei(value,"ether");
}

contract('Flight Surety App flight Tests', async (accounts) => {
  before(async () =>  {
    this.accounts = accounts;
  });
  before('setup contract', async () => {
    this.flightSuretyData = await FlightSuretyData.new();
    this.flightSuretyApp = await FlightSuretyApp.new(this.flightSuretyData.address);
    await this.flightSuretyApp.setAirlineMinimumFunds(web3.utils.toWei("2","ether"));
    await this.flightSuretyData.authorizeContract(this.flightSuretyApp.address);
    await this.flightSuretyApp.bootstrap("A0",{value: web3.utils.toWei("2","ether")});
  });

  describe("when paused", async () => {

  });

  describe('when not paused', async () => {
  
    describe('airlne registered', async () => {
      before(async () =>  {
          await this.flightSuretyApp.registerAirline(this.accounts[1],"A1");
          await this.flightSuretyApp.fund(this.accounts[1],{from: this.accounts[1], value: fromEther("2")});
      });

      it('can register a flight', async () => {
        let tx = await this.flightSuretyApp.registerFlight(this.accounts[1],"UA256", {from: this.accounts[1]});
        expectEvent.inLogs(tx.logs,"FlightRegistered",{airline: this.accounts[1],name: "UA256"});
      });

      describe('when flight registered', async () => {
        let ts = Math.floor(Date.now()/1000);
        it('can buy insurance for multiple customers',async () => {
          let tx = await this.flightSuretyApp.buy("UA256",ts, {from: this.accounts[2], value: fromEther("1")});
          expectEvent.inLogs(tx.logs,"PolicyPurchased",{customer: this.accounts[2]});
        });


        it('has insurance price ceiling',async () => {
          await expectRevert(
             this.flightSuretyApp.buy("UA256",ts, {from: this.accounts[3], value: fromEther("2")}),
            "Max allowable insurance price exceeded"
          );
        });

        it('can set flight status', async () => {
          let tx = await this.flightSuretyApp.setFlightStatus(this.accounts[1],"UA256",ts,STATUS_CODE_ON_TIME);
          expectEvent.inLogs(tx.logs,'FlightStatusUpdated',
            {
              airline: this.accounts[1], 
              flight: "UA256",
              status: web3.utils.toBN(STATUS_CODE_ON_TIME)
            }
          );
        });

        it('can not set flight status on an expired policy ', async () => {
          await expectRevert(
             this.flightSuretyApp.setFlightStatus(this.accounts[1],"UA256",ts,STATUS_CODE_LATE_AIRLINE),
            "Expired policy."
          );
        });

        it('can pay funds to insurees', async () => {
          let ts = Math.floor(Date.now()/1000);
          let flight = "DL123"
          let tx = await this.flightSuretyApp.registerFlight(this.accounts[1],flight, {from: this.accounts[1]});
          tx = await this.flightSuretyApp.buy(flight,ts, {from: this.accounts[2], value: fromEther("1")});
          tx = await this.flightSuretyApp.setFlightStatus(this.accounts[1],flight,ts,STATUS_CODE_LATE_AIRLINE);
          expectEvent.inLogs(tx.logs,'FlightStatusUpdated',
            {
              airline: this.accounts[1], 
              flight: flight,
              status: web3.utils.toBN(STATUS_CODE_LATE_AIRLINE)
            }
          );
          // InsuranceCredit(customer: <indexed>
          // 0xF249c40872b28e8DBbf14E0EeFFcDb5f6179fA62 (address), payout:
          // 1500000000000000000 (uint256), policy:
          // 101076496914782058276898274381385962502745738443115232686145715330365416574418
          // (uint256))
          expectEvent.inLogs(
            tx.logs,
            "InsuranceCredit",
            {
              customer: this.accounts[2],
              payout: web3.utils.toWei("1.5","ether")
            }
          );


        });


      });
    });

    describe('when a flight is not registered', async () => {
        it('cannot buy insurance', async () => {
        });
        it('can not set flight status', async () => {
        });
        it('can not credit insuree', async () => {
        });
        it('can not pay funds to insurees', async () => {
        });
    })

    describe('airline not registered', async () => {
      it('can not register a flight', async () => {
      });
      it('cannot buy insurance', async () => {
      });
      it('can not set flight status', async () => {
      });
      it('can not credit insuree', async () => {
      });
      it('can not pay funds to insurees', async () => {
      });
    });
  });
});
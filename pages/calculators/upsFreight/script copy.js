// Imports
import * as Rushjs from '/libs/rushjs/js/rush.js';
import addresses from '/js/models/addresses.js';

// Consts
const corsAnywhereURL = 'https://bobthered-cors-anywhere.herokuapp.com/';
const discount = .1869;
// const discount = .0;
const upsServiceDescriptions = {
   '03' : 'UPS Ground',
   '12' : 'UPS 3 Day Select',
   '02' : 'UPS 2nd Day',
   '59' : 'UPS 2nd Day Air A.M.',
   '13' : 'UPS Next Day Air Saver',
   '01' : 'UPS Next Day Air',
   '14' : 'UPS Next Day Air Early',
};
const upsAPICredentials = {
   serviceAccessToken : {
      'AccessLicenseNumber':'4D5DFA30E51E44B2',
   },
   usernameToken : {
      'Username':'bobmcaleavey',
      'Password':'Superma3+',
   }
};

// Lets
let upsAddressClassification = {
   Code : "0",
   Description : 'Unclassified',
};

// Nodes
const pageNode = document.querySelector( 'page#calculators-upsFreight' );
const formNode = document.querySelector( 'form#calculators-upsFreight' );
const nonValidatedRateButtonNode = formNode.querySelector( '.nonValidatedRate' );
const presetNodes = formNode.querySelectorAll( '[name="preset"]');
const stepsNode = formNode.closest('.steps');
const stepNodes = stepsNode.querySelectorAll(':scope > *');
const resultsNode = pageNode.querySelector( '[step="results"]');
const quoteAgainButtonNodes = pageNode.querySelectorAll( '.quoteAgain' );
const shipToNode = formNode.querySelector( '.shipTo' );
const candidateColumnNode = pageNode.querySelector( '[step="candidates"] .candidateList');
const shipFromNode = formNode.querySelector( '.shipFrom' );
const packageInfoNode = formNode.querySelector( '.packageInfo' );
const quantityNode = packageInfoNode.querySelector( '[name="quantity"]' );
const classificationNode = resultsNode.querySelector( 'classification' );
const request = {
    "RateRequest":{
      "CustomerClassification" : {
        "Code" : "04"
      },
       "request":{
          "SubVersion":"1703",
          "TransactionReference":{
             "CustomerContext":" "
          }
       },
       "Shipment":{
          "ShipmentRatingOptions":{
             "UserLevelDiscountIndicator":"FALSE"
          },
          "Shipper":{
             "Address":{
                "AddressLine":[],
                "City":"Caledonia",
                "StateProvinceCode":"NY",
                "PostalCode":"14423",
                "CountryCode":"US"
             }
          },
          "ShipTo":{
             "Address":{
                "AddressLine":[],
                "City":"Wylie",
                "StateProvinceCode":"TX",
                "PostalCode":"75098",
                "CountryCode":"US"
             }
          },
          "ShipFrom":{
             "Address":{
                "AddressLine":[],
                "City":"Caledonia",
                "StateProvinceCode":"NY",
                "PostalCode":"14423",
                "CountryCode":"US"
             }
          },
          "Service":{
             "Code":"03",
             "Description":"Service Code Description"
          },
          "Package":{
             "PackagingType":{
                "Code":"02",
                "Description":"Rate"
             },
             "PackageWeight":{
                "UnitOfMeasurement":{
                   "Code":"Lbs",
                   "Description":"pounds"
                },
                "Weight":"17.4"
             }
          }
       }
    }
  };
const candidateButtonClickHandler = e => {
   e.preventDefault();
   const candidate = JSON.parse( decodeURIComponent( e.target.getAttribute( 'candidate' ) ) );
   updateShipTo( candidate.AddressKeyFormat );
   Rushjs.progressIndicator.create({
      steps : [
         'Validating Ship To Address',
         'Getting Validated Rates from UPS Server'
      ]
   });
   getUPSRate();
}
const getRates = async () => {
   try {
      const response = await fetch(
          corsAnywhereURL +
          // 'https://onlinetools.ups.com/ship/v1/rating/Shop', {
          'https://wwwcie.ups.com/ship/v1/rating/Shop', {
              headers: new Headers({
                 'Access-Control-Allow-Origin' : '*',
                  'AccessLicenseNumber':upsAPICredentials.serviceAccessToken.AccessLicenseNumber,
                  'Username':upsAPICredentials.usernameToken.Username,
                  'Password':upsAPICredentials.usernameToken.Password,
              }),
              method : 'POST',
              body: JSON.stringify( request )
          }
      );
      // console.log( response.headers );
      const result = await response.json();
      return result.RateResponse;
   } catch (error) {
      return error;
   }
}
const getUPSRate = async() => {
   updateUPSData();
   const rateResponse = await getRates();
   Rushjs.progressIndicator.destroy();
   if( typeof rateResponse == 'string' ) {
      Rushjs.modal.error( 'Rates are temporarily unavailable.  Check again in a few minutes.  This error has been logged.  If this continues to be an issue, please contact your administrator.' );
   } else if ( typeof rateResponse == 'undefined' ) {
      Rushjs.modal.error( 'We could not calculate rates for the supplied information.<br><br>Please look over the shipping and package information and try again.');
   } else {
      updateRates(rateResponse.RatedShipment);
      setStep('results');
   }
}
const getValidatedRate = async () => {
   const validAddress = await validateShipTo();
   switch( typeof validAddress) {
      case 'boolean' :
         Rushjs.progressIndicator.destroy();
         Rushjs.modal.error( 'We could not validate the supplied address, nor find any possible candidates.' );
         break;
      case 'object' :
         switch( validAddress.length ) {
            case undefined:
               Rushjs.progressIndicator.update.currentStep(1);
               getUPSRate();
               break;
            default :
               updateCandidates( validAddress );
               setStep('candidates');
               Rushjs.progressIndicator.destroy();
               break;
         }
         break;
   }
}
const formSubmitHandler = async e => {
   e.preventDefault();
   Rushjs.progressIndicator.create({
      steps : [
         'Validating Ship To Address',
         'Getting Validated Rates from UPS Server'
      ]
   });
   getValidatedRate();
}
const nonValidatedRateButtonClickHandler = e => {
   e.preventDefault();
   Rushjs.progressIndicator.create({
      steps : ['Getting Non-Validated Rates From UPS Server']
   });
   upsAddressClassification = {
      Code : "0",
      Description : 'Not-Classified',
   }
   getUPSRate();
}
const presetChangeHandler = e => {
    const preset = e.target.value;
    if ( preset != '' ) {
        const inputNodes = e.target.closest('flexColumn').querySelectorAll( 'input, select:not([name="preset"])' );
        inputNodes.forEach( inputNode => {
            const inputName = inputNode.getAttribute( 'name' );
            inputNode.value = addresses[preset][inputName];
        } );
    }
}
const quoteAgainButtonClickHandler = e => {
   e.preventDefault();
   setStep('form');
}
const setStep = step => {
    stepNodes.forEach( stepNode => stepNode.setAttribute( 'hidden', '' ) );
    stepsNode.querySelector( `[step="${step}"]`).removeAttribute( 'hidden' );
}
const updateCandidates = candidates => {
   candidateColumnNode.innerHTML = '';
   candidates.forEach( candidate => {
      const flexRowNode = document.createElement( 'flexRow' );
      flexRowNode.setAttribute( 'alignItems', 'center' );
      flexRowNode.setAttribute( 'justify', 'spaceBetween' );
      const address = `${candidate.AddressKeyFormat.AddressLine}, ${candidate.AddressKeyFormat.PoliticalDivision2}, ${candidate.AddressKeyFormat.PoliticalDivision1} ${candidate.AddressKeyFormat.PostcodePrimaryLow}-${candidate.AddressKeyFormat.PostcodeExtendedLow}`;
      flexRowNode.innerHTML = `<address>${address}</address><button candidate="${encodeURIComponent(JSON.stringify(candidate))}">Select</button>`;
      flexRowNode.querySelector( 'button' ).addEventListener( 'click', candidateButtonClickHandler );
      candidateColumnNode.appendChild(flexRowNode);
   } );
}
const updateRates = ratedShipments => {
   classificationNode.innerHTML = upsAddressClassification.Description;
   const quantity = +quantityNode.value;
   const ratesNode = resultsNode.querySelector( '.rates' );
   let flexRows = [];
   ratedShipments.forEach( ratedShipment => {
      flexRows.push([
         ratedShipment.Service.Code,
         upsServiceDescriptions[ratedShipment.Service.Code],
         ( parseFloat( ratedShipment.TotalCharges.MonetaryValue ) * quantity / ( 1 + discount ) ).toFixed( 2 )
      ]);
   } );
   flexRows = flexRows.sort( ( a, b ) => +a[2] - +b[2] );
   ratesNode.innerHTML = flexRows
      .map( row =>`<flexRow justify="spaceBetween" serviceCode="${row[0]}"><description>${row[1]}</description><rate>$${row[2]}</rate></flexRow>`)
      .join( '\n' );
}
const updateShipTo = address => {
   shipToNode.querySelector('[name="address"]').value = address.AddressLine;
   shipToNode.querySelector('[name="city"]').value = address.PoliticalDivision2;
   shipToNode.querySelector('[name="state"]').value = address.PoliticalDivision1;
   shipToNode.querySelector('[name="zip"]').value = `${address.PostcodePrimaryLow}-${address.PostcodeExtendedLow}`;
}
const updateUPSData = () => {
    request.RateRequest.Shipment.ShipFrom.Address.AddressLine       = [shipFromNode.querySelector('[name="address"]').value];
    request.RateRequest.Shipment.ShipFrom.Address.City              = shipFromNode.querySelector('[name="city"]').value;
    request.RateRequest.Shipment.ShipFrom.Address.StateProvinceCode = shipFromNode.querySelector('[name="state"]').value;
    request.RateRequest.Shipment.ShipFrom.Address.PostalCode        = shipFromNode.querySelector('[name="zip"]').value;
    request.RateRequest.Shipment.ShipTo.Address.AddressLine         = [shipToNode.querySelector('[name="address"]').value];
    request.RateRequest.Shipment.ShipTo.Address.City                = shipToNode.querySelector('[name="city"]').value;
    request.RateRequest.Shipment.ShipTo.Address.StateProvinceCode   = shipToNode.querySelector('[name="state"]').value;
    request.RateRequest.Shipment.ShipTo.Address.PostalCode          = shipToNode.querySelector('[name="zip"]').value;
    request.RateRequest.Shipment.Package.PackageWeight.Weight       = packageInfoNode.querySelector('[name="weight"]').value;
}
const validateShipTo = async () => {
   const _upsBody = {
     "UPSSecurity":{
       "UsernameToken": upsAPICredentials.usernameToken,
       "ServiceAccessToken": upsAPICredentials.serviceAccessToken
     },
     "XAVRequest":{
       "Request":{
         "RequestOption":"3"
       },
       "MaximumListSize":"10",
       "AddressKeyFormat":{
         "AddressLine": shipToNode.querySelector( '[name="address"]' ).value,
         "PoliticalDivision2":shipToNode.querySelector( '[name="city"]' ).value,
         "PoliticalDivision1":shipToNode.querySelector( '[name="state"]' ).value,
         "PostcodePrimaryLow":shipToNode.querySelector( '[name="zip"]' ).value,
         "CountryCode":"US"
       }
     }
   };
   try {
      const response = await fetch( 
         corsAnywhereURL + 
         'https://onlinetools.ups.com/rest/XAV', {
         // 'http://127.0.0.1:5000/', {
            headers : {
               'origin' : 'x-requested-with',
               'Access-Control-Allow-Headers' : 'Origin, X-Requested-With, Content-Type, Accept',
               'Access-Control-Allow-Methods' : 'POST',
               'Access-Control-Allow-Origin' : '*',
               'Content-Type' : 'application/json',
            },
            method : 'POST',
            body   : JSON.stringify( _upsBody )
         } );
      // console.log( response );
      const data = await response.json();
      // console.log(data);
      if ( data.XAVResponse.hasOwnProperty( 'Candidate' ) ) {
         upsAddressClassification = data.XAVResponse.AddressClassification;
         return data.XAVResponse.Candidate;
      } else {
        return false;
      }
   } catch (error ) {
      Rushjs.progressIndicator.destroy();
      Rushjs.modal.error( 'UPS Rate Server is temporarily down.  Please try again in a few minutes.')
      console.log (error);
   }
};

formNode.addEventListener( 'submit', formSubmitHandler );
nonValidatedRateButtonNode.addEventListener( 'click', nonValidatedRateButtonClickHandler );
presetNodes.forEach( presetNode => {
    presetNode.addEventListener( 'change', presetChangeHandler );
} );

quoteAgainButtonNodes.forEach( quoteAgainButtonNode => {
   quoteAgainButtonNode.addEventListener( 'click', quoteAgainButtonClickHandler );
} );
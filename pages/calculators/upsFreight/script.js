// Imports
import * as Rushjs from '/libs/rushjs/js/rush.js';
import addresses from '/js/models/addresses.js';

// Consts
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
// const upsRateURL = 'http://localhost:5000/api/v1/rate';
// const upsValidateURL = 'http://localhost:5000/api/v1/validate';
const upsRateURL = 'https://bobthered-ups.herokuapp.com/api/v1/rate';
const upsValidateURL = 'https://bobthered-ups.herokuapp.com/api/v1/validate';

// Lets

// Nodes
const pageNode = document.querySelector( 'page#calculators-upsFreight' );
const formNode = pageNode.querySelector( 'form#calculators-upsFreight' );
const nonValidatedRateButtonNode = formNode.querySelector( '.nonValidatedRate' );
const stepsNode = formNode.closest('.steps');
const stepNodes = stepsNode.querySelectorAll(':scope > *');
const presetNodes = formNode.querySelectorAll( '[name="preset"]');
const candidateColumnNode = pageNode.querySelector( '[step="candidates"] .candidateList');
const quoteAgainButtonNodes = pageNode.querySelectorAll( '.quoteAgain' );
const packageInfoNode = formNode.querySelector( '.packageInfo' );
const quantityNode = packageInfoNode.querySelector( '[name="quantity"]' );
const weightNode = packageInfoNode.querySelector( '[name="weight"]' );
const resultsNode = pageNode.querySelector( '[step="results"]' );
const resultsAddressNode = resultsNode.querySelector( 'address' );
const resultsClassificationNode = resultsNode.querySelector( 'classification' );
const resultsRatesNode = resultsNode.querySelector( '.rates' );

// Functions
const candidateButtonClickHandler = e => {
   const candidate = JSON.parse( decodeURIComponent( e.target.getAttribute( 'candidate' ) ) );
   const address = {
      'address' : candidate.AddressKeyFormat.AddressLine,
      'city' : candidate.AddressKeyFormat.PoliticalDivision2,
      'state' : candidate.AddressKeyFormat.PoliticalDivision1,
      'zip' : candidate.AddressKeyFormat.PostcodePrimaryLow,
   };
   Rushjs.progressIndicator.create({
      steps : [
         'Validating Ship To Address',
         'Getting Validated Rates from UPS Server'
      ]
   });
   getValidatedRate( address );
}
const formSubmitHandler = e => {
   e.preventDefault();
   const address = {
      'address' : formNode.querySelector( '.shipTo input[name="address"]').value,
      'city' : formNode.querySelector( '.shipTo input[name="city"]').value,
      'state' : formNode.querySelector( '.shipTo select[name="state"]').value,
      'zip' : formNode.querySelector( '.shipTo input[name="zip"]').value,
   };
   getValidatedRate( address );
}
const getUPSRate = async candidate => {
   const shipToAddress = {
      'address' : candidate.AddressKeyFormat.AddressLine,
      'city' : candidate.AddressKeyFormat.PoliticalDivision2,
      'state' : candidate.AddressKeyFormat.PoliticalDivision1,
      'zip' : candidate.AddressKeyFormat.PostcodePrimaryLow,
   }
   const rateInfo = {
      shipFrom : {
         'address' : formNode.querySelector( '.shipFrom input[name="address"]').value,
         'city' : formNode.querySelector( '.shipFrom input[name="city"]').value,
         'state' : formNode.querySelector( '.shipFrom select[name="state"]').value,
         'zip' : formNode.querySelector( '.shipFrom input[name="zip"]').value,
      },
      shipTo : shipToAddress,
      weight : weightNode.value
   };
   try {
      const response = await fetch(
         upsRateURL, {
            body : JSON.stringify( rateInfo ),
            headers : {
               'Content-Type' : 'application/json',
            },
            method : 'POST',
         }
      );
      const data = await response.json();
      return data.RateResponse.RatedShipment;
   } catch (error) {
      Rushjs.progressIndicator.destroy();
      Rushjs.modal.error( 'UPS Rate Server is temporarily down.  Please try again in a few minutes.')
      console.log (error);
   }
}
const getValidatedRate = async address => {
   Rushjs.progressIndicator.create({
      steps : [
         'Validating Ship To Address',
         'Getting Validated Rates from UPS Server'
      ]
   });
   const validation = await validateAddress( address );
   switch ( validation.status ) {
      case 'No Candidates':
         Rushjs.progressIndicator.destroy();
         Rushjs.modal.error( 'We could not validate the supplied address, nor find any possible candidates.' );
         break;
      case 'Multiple Candidates':
         Rushjs.progressIndicator.destroy();
         updateCandidates( Array.isArray(validation.candidates) ? validation.candidates : [validation.candidates] );
         setStep('candidates');
         break;
      default:
         Rushjs.progressIndicator.update.currentStep(1);
         const rates = await getUPSRate( validation.candidate );
         updateResults( validation.candidate, rates );
         break;
   }
}
const nonValidatedRateButtonClickHandler = async e => {
   e.preventDefault();
   Rushjs.progressIndicator.create({
      steps : ['Getting Non-Validated Rates From UPS Server']
   });
   const candidate = {
      AddressClassification: {Code: "0", Description: "Unclassified"},
      AddressKeyFormat:{
         'AddressLine' : formNode.querySelector( '.shipTo input[name="address"]').value,
         'PoliticalDivision2' : formNode.querySelector( '.shipTo input[name="city"]').value,
         'PoliticalDivision1' : formNode.querySelector( '.shipTo select[name="state"]').value,
         'PostcodePrimaryLow' : formNode.querySelector( '.shipTo input[name="zip"]').value,
      }
   };
   candidate.AddressKeyFormat.Region = `${candidate.AddressKeyFormat.PoliticalDivision2} ${candidate.AddressKeyFormat.PoliticalDivision1} ${candidate.AddressKeyFormat.PostcodePrimaryLow}`;

   const rates = await getUPSRate( candidate );
   updateResults( candidate, rates );
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
const updateResults = ( candidate, rates ) => {
   Rushjs.progressIndicator.destroy();
   setStep( 'results' );
   resultsAddressNode.innerHTML = `${candidate.AddressKeyFormat.AddressLine}, <br>${candidate.AddressKeyFormat.Region}`;
   resultsClassificationNode.innerHTML = `${candidate.AddressClassification.Description}`;
   const quantity = +quantityNode.value;
   let flexRows = [];
   rates.forEach( rate => {
      flexRows.push([
         rate.Service.Code,
         upsServiceDescriptions[rate.Service.Code],
         ( parseFloat( rate.TotalCharges.MonetaryValue ) * quantity / ( 1 + discount ) ).toFixed( 2 )
      ]);
   });
   flexRows = flexRows.sort( ( a, b ) => +a[2] - +b[2] );
   resultsRatesNode.innerHTML = flexRows
      .map( row =>`<flexRow justify="spaceBetween" serviceCode="${row[0]}"><description>${row[1]}</description><rate>$${row[2]}</rate></flexRow>`)
      .join( '\n' );
}
const validateAddress = async address => {
   try {
      const response = await fetch(
         upsValidateURL, {
            body : JSON.stringify( address ),
            headers : {
               'Content-Type' : 'application/json',
            },
            method : 'POST',
         }
      );
      const data = await response.json();
      if ( data.XAVResponse.hasOwnProperty( 'NoCandidatesIndicator' ) ) { return { status : 'No Candidates' }; }
      if ( data.XAVResponse.hasOwnProperty( 'AmbiguousAddressIndicator' ) ) { return { status : 'Multiple Candidates', candidates : data.XAVResponse.Candidate }; }
      return { status: 'One Candidate', candidate : data.XAVResponse.Candidate };
   } catch (error) {
      Rushjs.progressIndicator.destroy();
      Rushjs.modal.error( 'UPS Rate Server is temporarily down.  Please try again in a few minutes.')
      console.log (error);
   }
}

// Node interactions
formNode.addEventListener( 'submit', formSubmitHandler );
nonValidatedRateButtonNode.addEventListener( 'click', nonValidatedRateButtonClickHandler );
presetNodes.forEach( presetNode => {
   presetNode.addEventListener( 'change', presetChangeHandler );
} );
quoteAgainButtonNodes.forEach( quoteAgainButtonNode => {
   quoteAgainButtonNode.addEventListener( 'click', quoteAgainButtonClickHandler );
} );
const bodyNode = document.querySelector( 'body' );
const progressIndicator = {
    addNodes : () => {
        progressIndicator.append.containerNode();
        progressIndicator.append.progressIndicator();
        if ( progressIndicator.steps.length > 1 ) {
            progressIndicator.append.steps();
        }
        progressIndicator.append.spinner();
        progressIndicator.append.message();
    },
    append : {
        containerNode : () => {
            if ( document.querySelector( 'progressIndicatorContainer' ) == null ) {
                const containerNode = document.createElement( 'progressIndicatorContainer' );
                bodyNode.appendChild( containerNode );
                progressIndicator.containerNode = containerNode;
            }
        },
        message : () => {
            if ( progressIndicator.containerNode.querySelector( 'message' ) == null ) {
                const messageNode = document.createElement( 'message' );
                progressIndicator.progressIndicatorNode.appendChild( messageNode );
                progressIndicator.messageNode = messageNode;
            }
        },
        progressIndicator : () => {
            if ( progressIndicator.containerNode.querySelector( 'progressIndicator' ) == null ) {
                const progressIndicatorNode = document.createElement( 'progressIndicator' );
                progressIndicator.containerNode.appendChild( progressIndicatorNode );
                progressIndicator.progressIndicatorNode = progressIndicatorNode;
            }
        },
        spinner : () => {
            if ( progressIndicator.containerNode.querySelector( 'spinner' ) == null ) {
                const spinnerNode = document.createElement( 'spinner' );
                progressIndicator.progressIndicatorNode.appendChild( spinnerNode );
                progressIndicator.spinnerNode = spinnerNode;
            }
        },
        steps : () => {
            if ( progressIndicator.containerNode.querySelector( 'steps' ) == null ) {
                const stepsNode = document.createElement( 'steps' );
                progressIndicator.progressIndicatorNode.appendChild( stepsNode );
                progressIndicator.stepsNode = stepsNode;
                progressIndicator.steps.forEach( ( step, index ) => {
                    const stepNode = document.createElement( 'step' );
                    stepNode.innerHTML = ( index + 1 );
                    progressIndicator.stepsNode.appendChild( stepNode );
                } );
            }
        },
    },
    create : params => {
        if ( params.hasOwnProperty('steps') ) { progressIndicator.steps = params.steps; }
        if ( params.hasOwnProperty('currentStep') ) { progressIndicator.currentStep = params.currentStep; }
        if ( !params.hasOwnProperty('currentStep' ) ) { progressIndicator.currentStep = 0; }
        progressIndicator.addNodes();
        progressIndicator.update.steps();
        progressIndicator.update.message();
    },
    destroy : () => {
        progressIndicator.containerNode.parentNode.removeChild( progressIndicator.containerNode );
    },
    update : {
        currentStep : currentStep => { 
            progressIndicator.currentStep = currentStep;
            progressIndicator.update.steps();
            progressIndicator.update.message();
        },
        message : () => {
            progressIndicator.messageNode.innerHTML = progressIndicator.steps[progressIndicator.currentStep];
        },
        steps : () => {
            if ( progressIndicator.steps.length > 1 ) {
                progressIndicator.stepsNode.querySelectorAll( 'step' ).forEach( ( step, index ) => {
                    if ( index < progressIndicator.currentStep ) {
                        step.setAttribute( 'status', 'completed' );
                    }
                    if ( index == progressIndicator.currentStep ) {
                        step.setAttribute( 'status', 'current' );
                    }
                    if ( index > progressIndicator.currentStep ) {
                        step.setAttribute( 'status', '' );
                    }
                } );
            }
        }
    }
};
export default progressIndicator;
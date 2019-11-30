const spinner = {
    clickHandler : {
        container : e => {
            if ( e.target == e.currentTarget && spinner.closeable ) {
                spinner.hide();
            }
        }
    },
    closeable : false,
    hide : () => {
        spinner.containerNode.setAttribute( 'hidden', '' );
    },
    init : () => {
        spinner.set.nodes();
        spinner.set.listeners();
    },
    set : {
        listeners: () => {
            spinner.containerNode.addEventListener( 'click', spinner.clickHandler.container );
        },
        nodes : () => {
            spinner.containerNode = document.querySelector( 'spinnerContainer' );
        }
    },
    show : () => spinner.containerNode.removeAttribute( 'hidden' ),
};
export default spinner
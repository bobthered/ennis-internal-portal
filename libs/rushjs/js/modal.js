const modal = {
    clickHandler : {
        closeModal : e => {
            e.preventDefault();
            if ( modal.closeable ) {
                modal.close();
            }
        },
        container : e => {
            if ( e.target == e.currentTarget && modal.closeable ) {
                modal.close();
            }
        },
    },
    close: () => {
        modal.nodes.container.setAttribute( 'hidden', '' );
        document.querySelectorAll( 'modal' ).forEach( modalNode => {
            modalNode.setAttribute( 'hidden', '' );
        } );
    },
    closeable : true,
    error : message => {
        modal.nodes.errorMessage.innerHTML = message;
        modal.show( 'error' );
    },
    init : () => {
        modal.set.nodes();
        modal.set.listeners();
    },
    nodes : {},
    set : {
        listeners : () => {
            modal.nodes.container.addEventListener( 'click', modal.clickHandler.container );
            modal.nodes.closeModals.forEach( closeModal => {
                closeModal.addEventListener( 'click', modal.clickHandler.closeModal );
            } );
        },
        nodes : () => {
            modal.nodes.closeModals = document.querySelectorAll( '.closeModal, closeModal' );
            modal.nodes.container = document.querySelector( 'modalContainer' );
            modal.nodes.error = document.querySelector( 'modal.error' );
            modal.nodes.errorMessage = modal.nodes.error.querySelector( 'message' );
        },
    },
    show : modalClass => {
        modal.nodes.container.removeAttribute( 'hidden' );
        document.querySelector( `modal.${modalClass}` ).removeAttribute( 'hidden' );
    }
};
modal.init();
export default modal;
export const helpers = {
    getFormDataAsJSON : elementNode => {
        const obj = {};
        // elementNode.querySelectorAll( 'input')
    },
    serialize : formNode => {

        // Setup our serialized data
        var serialized = [];
    
        // Loop through each field in the formNode
        for (var i = 0; i < formNode.elements.length; i++) {
    
            var field = formNode.elements[i];
    
            // Don't serialize fields without a name, submits, buttons, file and reset inputs, and disabled fields
            if (!field.name || field.disabled || field.type === 'file' || field.type === 'reset' || field.type === 'submit' || field.type === 'button') continue;
    
            // If a multi-select, get all selections
            if (field.type === 'select-multiple') {
                for (var n = 0; n < field.options.length; n++) {
                    if (!field.options[n].selected) continue;
                    serialized.push(encodeURIComponent(field.name) + "=" + encodeURIComponent(field.options[n].value));
                }
            }
    
            // Convert field data to a query string
            else if ((field.type !== 'checkbox' && field.type !== 'radio') || field.checked) {
                serialized.push(encodeURIComponent(field.name) + "=" + encodeURIComponent(field.value));
            }
        }
    
        return serialized.join('&');
    
    }
}
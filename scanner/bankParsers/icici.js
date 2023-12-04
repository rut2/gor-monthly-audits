const {createFileReadStream} = require("../../helpers/fileSystem");
const {findIndex} = require("lodash");


const ICICI_PROCESSING_TASKS_TYPES = {
    ACCOUNT_NUMBER: 'account-number', STATEMENT_DATE: 'statement-date', TRANSACTIONS: 'transactions'
}

const ICICI_PROCESSING_TASKS_ORDER = [ICICI_PROCESSING_TASKS_TYPES.ACCOUNT_NUMBER, ICICI_PROCESSING_TASKS_TYPES.STATEMENT_DATE, ICICI_PROCESSING_TASKS_TYPES.TRANSACTIONS]

const ICICI_STRING_CONSTANTS = {
    ACCOUNT_NUMBER: 'Account Number'
}

const ICICI_TRANSACTION_TASKS_TYPES = {
    DATE: 'date',
    DESCRIPTION: 'description',
    AMOUNT: 'amount',
    TYPE: 'type'
}

const ICICI_TRANSACTION_TASKS_PROCESSING_ORDER = [
    ICICI_TRANSACTION_TASKS_TYPES.DATE,
    ICICI_TRANSACTION_TASKS_TYPES.DESCRIPTION,
    ICICI_TRANSACTION_TASKS_TYPES.AMOUNT,
    ICICI_TRANSACTION_TASKS_TYPES.TYPE
]

const REGEXES = {
    date: /\d\d-\d\d-\d\d\d\d/,
    removeDateFromDescription: /\d\d-\d\d-\d\d\d\d(.*)/
}

const IGNORE_STRINGS = [
    'DateDescriptionAmountType'
];

const extractAccountNumber = (line) => {
    if (line.includes(ICICI_STRING_CONSTANTS.ACCOUNT_NUMBER)) {
        return line.split(':')[1];
    }
}


function onError(err) {
    if (err) {
        console.error('Error during file processing:', err);
    } else {
        console.log('File reading completed.');
    }
}


class ICICIProcessor {

    constructor() {
        this._ = {findIndex};

        this.ignoreStrings = IGNORE_STRINGS;
        this.regexes = REGEXES;

        this.transactionProcessingTasksTypes = ICICI_TRANSACTION_TASKS_TYPES;
        this.transactionProcessingTasksProcessingOrder = ICICI_TRANSACTION_TASKS_PROCESSING_ORDER;

        this.extracts = {meta: {}, transactions: []};

        this.transactionProcessor = {
            inProgress: false,
            current: ICICI_TRANSACTION_TASKS_TYPES.DATE,
            transaction: {}
        }

        this.processingTasksOrder = ICICI_PROCESSING_TASKS_ORDER;
    }

    async processTempFile(filePath) {
        const readStream = await createFileReadStream(filePath, {onLineRead: this.onLineRead.bind(this)}, onError);
    }

    onLineRead(line) {

        if (this.isLineIgnorable(line)) {
            return
        }

        this.processLine(line)
    }

    processLine(line) {
        switch (ICICI_PROCESSING_TASKS_ORDER[0]) {
            case ICICI_PROCESSING_TASKS_TYPES.ACCOUNT_NUMBER:
                this.processAccountNumber(line);
                break;
            case ICICI_PROCESSING_TASKS_TYPES.STATEMENT_DATE:
                this.processStatementDates(line);
                break;
            case ICICI_PROCESSING_TASKS_TYPES.TRANSACTIONS:
                this.processTransactions(line);
                break;
        }

    }

    processAccountNumber(line) {
        this.extracts.meta.accountNumber = extractAccountNumber(line);
        this.processingTasksOrder.shift();
    }

    processStatementDates(line) {
        const dates = line.split('From')[1].split('To');
        this.extracts.meta.startDate = dates[0].trim();
        this.extracts.meta.endDate = dates[1].trim();
        this.processingTasksOrder.shift();
    }

    processTransactions(line) {

        switch (this.transactionProcessor.current) {
            case this.transactionProcessingTasksTypes.DATE:
                this.extractDateFromTransaction(line);
                break;
            case this.transactionProcessingTasksTypes.DESCRIPTION:
                this.extractDescriptionFromTransaction(line);
                break;
        }

        if (this.transactionProcessor.current === this.transactionProcessingTasksTypes.DATE) {
            this.extractDateFromTransaction(line);
        }
    }

    extractDateFromTransaction(line) {

        const descriptionExtracts = line.match(this.regexes.date);
        this.transactionProcessor.transaction.date = descriptionExtracts[0];

        // extract first part of description from string
        this.transactionProcessor.transaction.description = this.removeDateFromDescription(line);

        this.switchToNextTransactionProcessingTask();
    }

    removeDateFromDescription(line) {
        return  line.match(this.regexes.removeDateFromDescription)[1];
    }

    extractDescriptionFromTransaction(line) {
        // this.transactionProcessor.transaction.description =

    }

    switchToNextTransactionProcessingTask() {

        const currentIndex = this.transactionProcessingTasksProcessingOrder.indexOf(this.transactionProcessor.current);

        this.transactionProcessor.current = this.transactionProcessingTasksProcessingOrder[currentIndex + 1]
    }

    isLineIgnorable(line) {
        return line.length === 0 || this.ignoreStrings.includes(line.trim())
    }
}

module.exports = ICICIProcessor;

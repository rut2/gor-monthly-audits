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
    removeDateFromDescription: /\d\d-\d\d-\d\d\d\d(.*)/,
    amount: /\d.*\.\d\d/
}

const IGNORE_STRINGS = [
    'DateDescriptionAmountType',
    'This is a system-generated statement. Hence, it does not require any signature.Page 1'
];

const DUPLICATED_IGNORABLE_STRING = {
    AccountNumber: 'Account Number',
    TransactionDate: 'Transaction date',
    SystemGenerateStatement: 'This is a system-generated statement. Hence, it does not require any signature.'
}

const extractAccountNumber = (line) => {
    if (line.includes(ICICI_STRING_CONSTANTS.ACCOUNT_NUMBER)) {
        return line.split(':')[1];
    }
}

class ICICIProcessor {

    constructor() {
        this._ = {findIndex};

        this.ignoreStrings = IGNORE_STRINGS;
        this.duplicatedIgnorableString = DUPLICATED_IGNORABLE_STRING;
        this.regexes = REGEXES;

        this.transactionProcessingTasksTypes = ICICI_TRANSACTION_TASKS_TYPES;
        this.transactionProcessingTasksProcessingOrder = ICICI_TRANSACTION_TASKS_PROCESSING_ORDER;

        this.extracts = {meta: {}, transactions: []};

        this.transactionProcessor = {
            current: ICICI_TRANSACTION_TASKS_TYPES.DATE,
            transaction: {}
        }

        this.processingTasksOrder = ICICI_PROCESSING_TASKS_ORDER;
    }

    async processTempFile(filePath) {
        await createFileReadStream(filePath, {
            onLineRead: this.onLineRead.bind(this)
        }, this.onError.bind(this));
    }

    onLineRead(line) {
        if (this.isLineIgnorable(line)) {
            return
        }
        this.processLine(line);
    }

    onError(err) {
        if (err) {
            console.error('Error during file processing:', err);
        } else {
            console.log('File reading completed.', this.extracts);
        }
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
            case this.transactionProcessingTasksTypes.TYPE:
                this.extractTransactionTypeFromTransaction(line);
                break;
        }
    }

    extractDateFromTransaction(line) {

        const descriptionExtracts = line.match(this.regexes.date);

        if (descriptionExtracts === null) {
            console.log("line : why thi ", line);
        }

        this.transactionProcessor.transaction.date = descriptionExtracts[0];

        // extract first part of description from string
        this.transactionProcessor.transaction.description = this.removeDateFromDescription(line);

        this.switchToNextTransactionProcessingTask();
    }

    removeDateFromDescription(line) {
        return line.match(this.regexes.removeDateFromDescription)[1];
    }

    extractDescriptionFromTransaction(line) {
        if (this.isLineAmount(line)) {
            this.switchToNextTransactionProcessingTask();
            this.extractAmountFromTransaction(line)
        } else {
            this.transactionProcessor.transaction.description += line;
        }
    }

    extractAmountFromTransaction(amount) {
        this.transactionProcessor.transaction.amount = parseFloat(amount);
        this.switchToNextTransactionProcessingTask();
    }

    extractTransactionTypeFromTransaction(line) {
        this.transactionProcessor.transaction.type = line.trim().toUpperCase();
        this.switchToNextTransactionProcessingTask();
    }

    isLineAmount(line) {
        return this.regexes.amount.test(line);
    }

    switchToNextTransactionProcessingTask() {
        const currentIndex = this.transactionProcessingTasksProcessingOrder.indexOf(this.transactionProcessor.current);

        if (currentIndex === this.transactionProcessingTasksProcessingOrder.length - 1) {
            this.resetTransactionProcessor();
        } else {
            this.transactionProcessor.current = this.transactionProcessingTasksProcessingOrder[currentIndex + 1]
        }
    }

    isLineIgnorable(line) {
        // 1. ignore blank line
        // 2. ignore already defined ignorable string
        // 3. ignore repeated system generate line
        if (line.length === 0 || this.ignoreStrings.includes(line.trim()) || line.trim().includes(this.duplicatedIgnorableString.SystemGenerateStatement)) {
            return true;
        }

        // 4. if account number is already set then ignore the footer line which contains account number
        // 5. if statement date is already set then ignore the footer line which contains statement date
        return (line.indexOf(this.duplicatedIgnorableString.AccountNumber) !== -1 && this.extracts.meta.accountNumber !== undefined) ||
            (line.indexOf(this.duplicatedIgnorableString.TransactionDate) !== -1 && this.extracts.meta.endDate !== undefined);
    }

    resetTransactionProcessor() {
        this.extracts.transactions.push(this.transactionProcessor.transaction);
        this.transactionProcessor = {
            current: ICICI_TRANSACTION_TASKS_TYPES.DATE,
            transaction: {}
        }
    }
}

module.exports = ICICIProcessor;

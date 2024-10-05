import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

type BusyDialogState = {
    open: boolean,
    message: string
}

const BusyDialog = ({ message, open }: BusyDialogState) => {
    return (
        <Dialog open={open} aria-labelledby="busy-dialog-title">
            <DialogContent style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Typography>{message}</Typography>
                <CircularProgress size="30px" />
            </DialogContent>
        </Dialog>
    );
};

export default BusyDialog;

import AuthGuard from "~/Components/AuthGuard";

const manage = () => {
    return (
        <AuthGuard>
            <div>
                This page should be shown only when the user is logged in.
            </div>
        </AuthGuard>
    );
}

export default manage;
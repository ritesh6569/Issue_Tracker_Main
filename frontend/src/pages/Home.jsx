import Header from "./Header";

function Home() {
    return (
        <div className="flex flex-col h-screen">
            <Header />
            <div className="flex-1 flex items-center justify-center bg-gray-100">
                <h1 className="text-3xl font-bold text-gray-700">Welcome to Issue Tracker</h1>
            </div>
        </div>
    );
}

export default Home;
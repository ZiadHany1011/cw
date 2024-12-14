import './NavBar.css'
const NavBar=({navigate})=>{
    return(
        <nav>
            <div className="logo" onClick={()=>{
                       navigate('home')
                    }}>
                BiteBuilder
            </div>
            <div>
                <ul>
                    <li onClick={()=>{
                       navigate('login')
                    }}>login</li>
                    <li onClick={()=>{
                       navigate('register')
                    }}>register</li>
                </ul>
            </div>
        </nav>
    );

}
export default NavBar
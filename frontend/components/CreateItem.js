import React, { Component } from 'react';
import { mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Form from './styles/Form';
import formatMoney from '../lib/formatMoney';

const CREATE_ITEM_MUTATION = gql`
    mutation CREATE_ITEM_MUTATION (
        $title: String!
        $description: String!
        $price: Int!
        $image: String
        $largeImage: String
    ) {
        createItem(
            title: $title
            description: $description
            price: $price
            image: $image
            largeImage: $largeImage
        ) {
            id
        }
    }
`;

class CreateItem extends Component {
    state = {
        title: 'Sick memes',
        description: 'thats a super sick meme yo',
        image: 'meme.jpg',
        largeImage: 'big_meme.jpg',
        price: 0,
    };
    handleChange = (e) => {
        const { name, type, value } = e.target;
        const val = type === 'number' ? parseFloat(value) : value;
        this.setState({ [name]: val})
    }
    render() {
        return (
            <Form onSubmit={(e) =>{
                e.preventDefault();
                console.log(this.state);
            }}>
                <fieldset>
                    <label htmlFor="title">
                        Title
                        <input type="text" id="title" name="title" placeholder="Title" required 
                        value={this.state.title}
                        onChange={this.handleChange}
                        />
                    </label>
                    <label htmlFor="price">
                        Price
                        <input type="number" id="price" name="price" placeholder="Price" required
                            value={this.state.price}
                            onChange={this.handleChange}
                        />
                    </label>
                    <label htmlFor="description">
                        Description
                        <textarea 
                         id="description" name="description" placeholder="Enter a description" required
                            value={this.state.description}
                            onChange={this.handleChange}
                        />
                    </label>
                    <button type="submit">Submit</button>
                </fieldset>
            </Form>
        );
    }
}

export default CreateItem;
export { CREATE_ITEM_MUTATION };
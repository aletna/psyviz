import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useQuery,
  gql,
} from "@apollo/client";
import { useEffect } from "react";

export default function SerumQueries(props: any) {
  const { loading, error, data } = useQuery(props.serumgql);

  // if (loading) return <p>Loading...</p>;
  // if (error) return <p>Error :(</p>;
  // console.log(data);
  useEffect(() => {
    if (data) {
      props.handleSerumData(data);
    }
  }, [props, data]);

  return <></>;
}
